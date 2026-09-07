// Nigerian Cities and State Coordinates Mapping for Dynamic Map Centering

export const NIGERIAN_LOCATION_COORDINATES = {
  // FCT - Abuja
  "abuja": [9.0765, 7.3986],
  "fct": [9.0765, 7.3986],
  "maitama": [9.0882, 7.4933],
  "wuse": [9.0647, 7.4725],
  "garki": [9.0347, 7.4878],
  "asokoro": [9.0435, 7.5255],
  "gwarinpa": [9.1089, 7.4042],
  "jabi": [9.0762, 7.4239],
  "utako": [9.0664, 7.4435],
  "apo": [8.9897, 7.5028],
  "kubwa": [9.1558, 7.3375],
  "lugbe": [8.9744, 7.3775],
  "lokogama": [8.9667, 7.4583],
  "life camp": [9.0711, 7.3944],
  "katampe": [9.1028, 7.4611],
  "guzape": [9.0278, 7.5278],
  
  // Rivers
  "port harcourt": [4.8156, 7.0498],
  "rivers": [4.8156, 7.0498],
  "obio-akpor": [4.8428, 7.0094],
  "eleme": [4.7936, 7.1517],
  "bonny": [4.4542, 7.1706],
  "gra port harcourt": [4.8089, 7.0022],
  
  // Oyo
  "ibadan": [7.3775, 3.9470],
  "oyo": [7.3775, 3.9470],
  "bodija": [7.4333, 3.9000],
  "oluyole": [7.3489, 3.8653],
  "agodi": [7.4028, 3.9167],
  "jericho": [7.3889, 3.8778],
  
  // Kano
  "kano": [12.0022, 8.5920],
  "sharada": [11.9722, 8.5139],
  
  // Anambra
  "awka": [6.2209, 7.0677],
  "onitsha": [6.1430, 6.7865],
  "nnewi": [6.0199, 6.9149],
  "anambra": [6.2209, 7.0677],
  
  // Enugu
  "enugu": [6.4584, 7.5464],
  "nsukka": [6.8561, 7.3958],
  "trans-ekulu": [6.4833, 7.5167],
  "new haven": [6.4444, 7.5111],
  
  // Edo
  "benin": [6.3350, 5.6037],
  "edo": [6.3350, 5.6037],
  "ekpoma": [6.7428, 6.1383],
  "auchi": [7.0667, 6.2667],
  
  // Delta
  "asaba": [6.1984, 6.7323],
  "warri": [5.5544, 5.7932],
  "delta": [6.1984, 6.7323],
  
  // Ogun
  "abeokuta": [7.1475, 3.3619],
  "sango ota": [6.7000, 3.2333],
  "mowe": [6.8167, 3.4333],
  "ibafo": [6.7333, 3.4167],
  "ogun": [7.1475, 3.3619],
  
  // Akwa Ibom
  "uyo": [5.0378, 7.9128],
  "eket": [4.6417, 7.9333],
  "ikot ekpene": [5.1833, 7.7167],
  "akwa ibom": [5.0378, 7.9128],
  
  // Abia
  "umuahia": [5.5265, 7.4896],
  "aba": [5.1066, 7.3667],
  "abia": [5.5265, 7.4896],
  
  // Others
  "kaduna": [10.5105, 7.4165],
  "jos": [9.8965, 8.8583],
  "plateau": [9.8965, 8.8583],
  "ilorin": [8.4799, 4.5418],
  "kwara": [8.4799, 4.5418],
  "calabar": [4.9757, 8.3417],
  "cross river": [4.9757, 8.3417],
  "owerri": [5.4833, 7.0333],
  "imo": [5.4833, 7.0333],
  "akure": [7.2571, 5.2058],
  "ondo": [7.2571, 5.2058],
  "osogbo": [7.7710, 4.5600],
  "osun": [7.7710, 4.5600],
  "ado ekiti": [7.6211, 5.2215],
  "ekiti": [7.6211, 5.2215],
  "yenagoa": [4.9267, 6.2676],
  "bayelsa": [4.9267, 6.2676],
  "makurdi": [7.7327, 8.5214],
  "benue": [7.7327, 8.5214],
  "maiduguri": [11.8333, 13.1500],
  "yola": [9.2094, 12.4818],
  "lafia": [8.4904, 8.5153],
  "nassarawa": [8.4904, 8.5153],
  
  // Lagos
  "lagos": [6.5244, 3.3792],
  "lekki": [6.4698, 3.5852],
  "victoria island": [6.4281, 3.4219],
  "ikoyi": [6.4549, 3.4316],
  "ikeja": [6.6018, 3.3515],
  "yaba": [6.5095, 3.3789],
  "surulere": [6.4950, 3.3520],
  "ajah": [6.4686, 3.5658],
  "gbagada": [6.5562, 3.3879],
  "festac": [6.4674, 3.2818],
  "ikorodu": [6.6194, 3.5105]
};

export function getEstimatedCoordinates(address = "", city = "", state = "") {
  const searchStr = `${address} ${city} ${state}`.toLowerCase();
  
  for (const [key, coords] of Object.entries(NIGERIAN_LOCATION_COORDINATES)) {
    if (searchStr.includes(key)) {
      return coords;
    }
  }

  return [6.5244, 3.3792]; // Default fallback if unspecified
}
