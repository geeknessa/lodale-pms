import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '../..');

/**
 * Returns the canonical absolute path to the local uploads directory.
 * Resolves consistently regardless of the terminal working directory (process.cwd()).
 * @returns {string}
 */
export const getUploadsDir = () => {
  if (process.env.UPLOADS_DIR) {
    return path.isAbsolute(process.env.UPLOADS_DIR)
      ? process.env.UPLOADS_DIR
      : path.resolve(backendRoot, process.env.UPLOADS_DIR);
  }
  return path.resolve(backendRoot, 'uploads');
};

/**
 * Checks whether Cloudinary credentials are fully configured.
 * Returns true only when CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET
 * are all set and non-empty.
 * @returns {boolean}
 */
export const isCloudinaryEnabled = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  return Boolean(
    CLOUDINARY_CLOUD_NAME && CLOUDINARY_CLOUD_NAME.trim() &&
    CLOUDINARY_API_KEY && CLOUDINARY_API_KEY.trim() &&
    CLOUDINARY_API_SECRET && CLOUDINARY_API_SECRET.trim()
  );
};

/**
 * Uploads a buffer to Cloudinary using upload_stream.
 * @param {Buffer} buffer - Raw file buffer
 * @param {object} options - Cloudinary upload stream options
 * @returns {Promise<object>} Cloudinary upload response object
 */
const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
      api_key: process.env.CLOUDINARY_API_KEY.trim(),
      api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
      secure: true,
    });

    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        return reject(new Error(`Cloudinary upload failed: ${error.message || error}`));
      }
      resolve(result);
    });

    stream.end(buffer);
  });
};

/**
 * Uploads an image buffer either to Cloudinary (if configured) or to the local disk uploads directory.
 * 
 * @param {object} params
 * @param {Buffer} params.buffer - The binary image buffer
 * @param {string} [params.folder='lodale'] - Destination subfolder (e.g. 'avatars', 'properties', 'payments')
 * @param {string} [params.filenamePrefix='file'] - Filename prefix for local storage
 * @param {string} [params.mimeExt='.jpg'] - File extension (e.g. '.jpg', '.png', '.webp')
 * @returns {Promise<{ url: string, publicId: string|null, storage: 'cloudinary'|'local' }>}
 */
export const uploadImage = async ({
  buffer,
  folder = 'lodale',
  filenamePrefix = 'file',
  mimeExt = '.jpg'
}) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error('Invalid image buffer: buffer must be a non-empty Buffer instance.');
  }

  if (isCloudinaryEnabled()) {
    const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
    const targetFolder = cleanFolder === 'lodale'
      ? 'lodale'
      : (cleanFolder.startsWith('lodale/') ? cleanFolder : `lodale/${cleanFolder}`);

    const result = await uploadToCloudinary(buffer, {
      folder: targetFolder,
      resource_type: 'image',
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      storage: 'cloudinary'
    };
  }

  // Local disk fallback
  const uploadsDir = getUploadsDir();

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const safeExt = mimeExt ? (mimeExt.startsWith('.') ? mimeExt : `.${mimeExt}`) : '.jpg';
  const filename = `${filenamePrefix}-${crypto.randomUUID()}${safeExt}`;
  const filePath = path.join(uploadsDir, filename);

  fs.writeFileSync(filePath, buffer);

  return {
    url: `/uploads/${filename}`,
    publicId: null,
    storage: 'local'
  };
};

export const uploadService = {
  isCloudinaryEnabled,
  uploadImage
};

export default uploadService;
