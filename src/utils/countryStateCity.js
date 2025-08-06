/**
 * Country, State, and City data utility
 * This file contains functions to get countries, states by country, and cities by state
 * For India, it includes a comprehensive list of states and districts
 */

// List of countries with ISO codes
const countries = [
  { name: 'India', isoCode: 'IN', phoneCode: '+91' },
  { name: 'United States', isoCode: 'US', phoneCode: '+1' },
  { name: 'United Kingdom', isoCode: 'GB', phoneCode: '+44' },
  // Add more countries as needed
];

// Indian states with ISO codes
const indianStates = [
  { name: 'Andhra Pradesh', isoCode: 'AP' },
  { name: 'Arunachal Pradesh', isoCode: 'AR' },
  { name: 'Assam', isoCode: 'AS' },
  { name: 'Bihar', isoCode: 'BR' },
  { name: 'Chhattisgarh', isoCode: 'CG' },
  { name: 'Goa', isoCode: 'GA' },
  { name: 'Gujarat', isoCode: 'GJ' },
  { name: 'Haryana', isoCode: 'HR' },
  { name: 'Himachal Pradesh', isoCode: 'HP' },
  { name: 'Jharkhand', isoCode: 'JH' },
  { name: 'Karnataka', isoCode: 'KA' },
  { name: 'Kerala', isoCode: 'KL' },
  { name: 'Madhya Pradesh', isoCode: 'MP' },
  { name: 'Maharashtra', isoCode: 'MH' },
  { name: 'Manipur', isoCode: 'MN' },
  { name: 'Meghalaya', isoCode: 'ML' },
  { name: 'Mizoram', isoCode: 'MZ' },
  { name: 'Nagaland', isoCode: 'NL' },
  { name: 'Odisha', isoCode: 'OD' },
  { name: 'Punjab', isoCode: 'PB' },
  { name: 'Rajasthan', isoCode: 'RJ' },
  { name: 'Sikkim', isoCode: 'SK' },
  { name: 'Tamil Nadu', isoCode: 'TN' },
  { name: 'Telangana', isoCode: 'TS' },
  { name: 'Tripura', isoCode: 'TR' },
  { name: 'Uttar Pradesh', isoCode: 'UP' },
  { name: 'Uttarakhand', isoCode: 'UK' },
  { name: 'West Bengal', isoCode: 'WB' },
  { name: 'Andaman and Nicobar Islands', isoCode: 'AN' },
  { name: 'Chandigarh', isoCode: 'CH' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', isoCode: 'DN' },
  { name: 'Delhi', isoCode: 'DL' },
  { name: 'Jammu and Kashmir', isoCode: 'JK' },
  { name: 'Ladakh', isoCode: 'LA' },
  { name: 'Lakshadweep', isoCode: 'LD' },
  { name: 'Puducherry', isoCode: 'PY' },
];

// Get all countries
const getCountries = () => {
  return countries;
};

// Get states by country
const getStatesByCountry = (countryName) => {
  if (countryName === 'India') {
    return indianStates;
  }
  // Add more country cases as needed
  return [];
};

// Get cities by state and country
const getCitiesByState = (countryName, stateName) => {
  // Return empty array as we're not using district/city selection
  return [];
};

// Get country by ISO code
const getCountryByIsoCode = (isoCode) => {
  return countries.find(country => country.isoCode === isoCode) || null;
};

// Get state by ISO code
const getStateByIsoCode = (isoCode) => {
  return indianStates.find(state => state.isoCode === isoCode) || null;
};

// Export all functions and variables
export {
  // Data
  countries,
  
  // Functions
  getCountries,
  getStatesByCountry,
  getCitiesByState,
  getCountryByIsoCode,
  getStateByIsoCode
};

// Default export with all the same values for backward compatibility
export default {
  // Data
  countries,
  
  // Functions
  getCountries,
  getStatesByCountry,
  getCitiesByState,
  getCountryByIsoCode,
  getStateByIsoCode
};
