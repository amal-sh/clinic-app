// src/utils/ageHelper.js
export const getLiveAge = (patient) => {
  // Safety check: if data is missing, return stored age
  if (!patient || !patient.created_at || !patient.age) {
    return patient.age || '-';
  }

  try {
    const createdDate = new Date(patient.created_at);
    const today = new Date();
    
    // Calculate difference in time (milliseconds)
    const diffTime = Math.abs(today - createdDate);
    
    // Convert time to years (taking leap years into account roughly with 365.25)
    const yearsPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
    
    // Return Original Age + Years Passed
    return parseInt(patient.age) + yearsPassed;
  } catch (error) {
    return patient.age;
  }
};