export interface DistrictLocation {
  district: string;
  cities: string[];
}

export interface StateLocation {
  state: string;
  districts: DistrictLocation[];
}

// India location seed list for offline pickers. The app stores exact
// labels from this list and the backend validates search/profile submissions
// against the same data.
export const INDIA_LOCATIONS: StateLocation[] = [
  { state: 'Andaman and Nicobar Islands', districts: [{ district: 'South Andaman', cities: ['Port Blair'] }, { district: 'North and Middle Andaman', cities: ['Mayabunder'] }, { district: 'Nicobars', cities: ['Car Nicobar'] }] },
  { state: 'Andhra Pradesh', districts: [{ district: 'Anantapur', cities: ['Anantapur'] }, { district: 'Guntur', cities: ['Guntur'] }, { district: 'Krishna', cities: ['Vijayawada'] }, { district: 'Visakhapatnam', cities: ['Visakhapatnam'] }] },
  { state: 'Arunachal Pradesh', districts: [{ district: 'Papum Pare', cities: ['Itanagar'] }, { district: 'East Siang', cities: ['Pasighat'] }, { district: 'Lohit', cities: ['Tezu'] }] },
  { state: 'Assam', districts: [{ district: 'Kamrup Metropolitan', cities: ['Guwahati'] }, { district: 'Dibrugarh', cities: ['Dibrugarh'] }, { district: 'Cachar', cities: ['Silchar'] }, { district: 'Jorhat', cities: ['Jorhat'] }] },
  { state: 'Bihar', districts: [{ district: 'Patna', cities: ['Patna'] }, { district: 'Gaya', cities: ['Gaya'] }, { district: 'Bhagalpur', cities: ['Bhagalpur'] }, { district: 'Muzaffarpur', cities: ['Muzaffarpur'] }] },
  { state: 'Chandigarh', districts: [{ district: 'Chandigarh', cities: ['Chandigarh'] }] },
  { state: 'Chhattisgarh', districts: [{ district: 'Raipur', cities: ['Raipur'] }, { district: 'Bilaspur', cities: ['Bilaspur'] }, { district: 'Durg', cities: ['Durg', 'Bhilai'] }] },
  { state: 'Dadra and Nagar Haveli and Daman and Diu', districts: [{ district: 'Daman', cities: ['Daman'] }, { district: 'Diu', cities: ['Diu'] }, { district: 'Dadra and Nagar Haveli', cities: ['Silvassa'] }] },
  { state: 'Delhi', districts: [{ district: 'Central Delhi', cities: ['New Delhi'] }, { district: 'South Delhi', cities: ['Saket'] }, { district: 'North West Delhi', cities: ['Rohini'] }] },
  { state: 'Goa', districts: [{ district: 'North Goa', cities: ['Panaji', 'Mapusa'] }, { district: 'South Goa', cities: ['Margao', 'Vasco da Gama'] }] },
  { state: 'Gujarat', districts: [{ district: 'Ahmedabad', cities: ['Ahmedabad'] }, { district: 'Surat', cities: ['Surat'] }, { district: 'Vadodara', cities: ['Vadodara'] }, { district: 'Rajkot', cities: ['Rajkot'] }] },
  { state: 'Haryana', districts: [{ district: 'Gurugram', cities: ['Gurugram'] }, { district: 'Faridabad', cities: ['Faridabad'] }, { district: 'Panchkula', cities: ['Panchkula'] }, { district: 'Hisar', cities: ['Hisar'] }] },
  { state: 'Himachal Pradesh', districts: [{ district: 'Shimla', cities: ['Shimla'] }, { district: 'Kangra', cities: ['Dharamshala'] }, { district: 'Kullu', cities: ['Kullu'] }] },
  { state: 'Jammu and Kashmir', districts: [{ district: 'Srinagar', cities: ['Srinagar'] }, { district: 'Jammu', cities: ['Jammu'] }, { district: 'Anantnag', cities: ['Anantnag'] }] },
  { state: 'Jharkhand', districts: [{ district: 'Ranchi', cities: ['Ranchi'] }, { district: 'East Singhbhum', cities: ['Jamshedpur'] }, { district: 'Dhanbad', cities: ['Dhanbad'] }] },
  { state: 'Karnataka', districts: [{ district: 'Bengaluru Urban', cities: ['Bengaluru'] }, { district: 'Mysuru', cities: ['Mysuru'] }, { district: 'Dakshina Kannada', cities: ['Mangaluru'] }, { district: 'Belagavi', cities: ['Belagavi'] }] },
  { state: 'Kerala', districts: [{ district: 'Thiruvananthapuram', cities: ['Thiruvananthapuram'] }, { district: 'Ernakulam', cities: ['Kochi'] }, { district: 'Kozhikode', cities: ['Kozhikode'] }, { district: 'Thrissur', cities: ['Thrissur'] }] },
  { state: 'Ladakh', districts: [{ district: 'Leh', cities: ['Leh'] }, { district: 'Kargil', cities: ['Kargil'] }] },
  { state: 'Lakshadweep', districts: [{ district: 'Lakshadweep', cities: ['Kavaratti'] }] },
  { state: 'Madhya Pradesh', districts: [{ district: 'Bhopal', cities: ['Bhopal'] }, { district: 'Indore', cities: ['Indore'] }, { district: 'Jabalpur', cities: ['Jabalpur'] }, { district: 'Gwalior', cities: ['Gwalior'] }] },
  { state: 'Maharashtra', districts: [{ district: 'Mumbai City', cities: ['Mumbai'] }, { district: 'Pune', cities: ['Pune'] }, { district: 'Nagpur', cities: ['Nagpur'] }, { district: 'Nashik', cities: ['Nashik'] }] },
  { state: 'Manipur', districts: [{ district: 'Imphal West', cities: ['Imphal'] }, { district: 'Thoubal', cities: ['Thoubal'] }, { district: 'Bishnupur', cities: ['Bishnupur'] }] },
  { state: 'Meghalaya', districts: [{ district: 'East Khasi Hills', cities: ['Shillong'] }, { district: 'West Garo Hills', cities: ['Tura'] }, { district: 'Ri Bhoi', cities: ['Nongpoh'] }] },
  { state: 'Mizoram', districts: [{ district: 'Aizawl', cities: ['Aizawl'] }, { district: 'Lunglei', cities: ['Lunglei'] }, { district: 'Champhai', cities: ['Champhai'] }] },
  { state: 'Nagaland', districts: [{ district: 'Kohima', cities: ['Kohima'] }, { district: 'Dimapur', cities: ['Dimapur'] }, { district: 'Mokokchung', cities: ['Mokokchung'] }] },
  { state: 'Odisha', districts: [{ district: 'Khordha', cities: ['Bhubaneswar'] }, { district: 'Cuttack', cities: ['Cuttack'] }, { district: 'Ganjam', cities: ['Berhampur'] }, { district: 'Sambalpur', cities: ['Sambalpur'] }] },
  { state: 'Puducherry', districts: [{ district: 'Puducherry', cities: ['Puducherry'] }, { district: 'Karaikal', cities: ['Karaikal'] }, { district: 'Mahe', cities: ['Mahe'] }, { district: 'Yanam', cities: ['Yanam'] }] },
  { state: 'Punjab', districts: [{ district: 'Amritsar', cities: ['Amritsar'] }, { district: 'Ludhiana', cities: ['Ludhiana'] }, { district: 'Jalandhar', cities: ['Jalandhar'] }, { district: 'Patiala', cities: ['Patiala'] }] },
  { state: 'Rajasthan', districts: [{ district: 'Jaipur', cities: ['Jaipur'] }, { district: 'Jodhpur', cities: ['Jodhpur'] }, { district: 'Udaipur', cities: ['Udaipur'] }, { district: 'Kota', cities: ['Kota'] }] },
  { state: 'Sikkim', districts: [{ district: 'Gangtok', cities: ['Gangtok'] }, { district: 'Namchi', cities: ['Namchi'] }, { district: 'Gyalshing', cities: ['Gyalshing'] }] },
  { state: 'Tamil Nadu', districts: [{ district: 'Chennai', cities: ['Chennai'] }, { district: 'Coimbatore', cities: ['Coimbatore'] }, { district: 'Madurai', cities: ['Madurai'] }, { district: 'Tiruchirappalli', cities: ['Tiruchirappalli'] }] },
  { state: 'Telangana', districts: [{ district: 'Hyderabad', cities: ['Hyderabad'] }, { district: 'Ranga Reddy', cities: ['Gachibowli', 'Shamshabad'] }, { district: 'Warangal', cities: ['Warangal'] }, { district: 'Karimnagar', cities: ['Karimnagar'] }] },
  { state: 'Tripura', districts: [{ district: 'West Tripura', cities: ['Agartala'] }, { district: 'North Tripura', cities: ['Dharmanagar'] }, { district: 'South Tripura', cities: ['Belonia'] }] },
  { state: 'Uttar Pradesh', districts: [{ district: 'Lucknow', cities: ['Lucknow'] }, { district: 'Kanpur Nagar', cities: ['Kanpur'] }, { district: 'Varanasi', cities: ['Varanasi'] }, { district: 'Prayagraj', cities: ['Prayagraj'] }] },
  { state: 'Uttarakhand', districts: [{ district: 'Dehradun', cities: ['Dehradun'] }, { district: 'Haridwar', cities: ['Haridwar'] }, { district: 'Nainital', cities: ['Haldwani', 'Nainital'] }] },
  { state: 'West Bengal', districts: [{ district: 'Kolkata', cities: ['Kolkata'] }, { district: 'North 24 Parganas', cities: ['Barasat'] }, { district: 'Darjeeling', cities: ['Darjeeling', 'Siliguri'] }, { district: 'Howrah', cities: ['Howrah'] }] },
];

export function getStates(): string[] {
  return INDIA_LOCATIONS.map((entry) => entry.state);
}

export function getDistricts(state?: string): StateLocation[] | string[] {
  if (!state) return INDIA_LOCATIONS;
  return INDIA_LOCATIONS.find((entry) => entry.state === state)?.districts.map((entry) => entry.district) || [];
}

export function getCities(state: string, district: string): string[] {
  return INDIA_LOCATIONS
    .find((entry) => entry.state === state)
    ?.districts.find((entry) => entry.district === district)
    ?.cities || [];
}

export function isValidLocation(state: string, district: string, city: string): boolean {
  return getCities(state, district).includes(city);
}
