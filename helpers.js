/**
 * @description Search the given email from the database
 * @param {*} email A string of an email
 * @param {*} database Database contain user profiles
 * @returns User profile if found, else return null
 */
const getUserByEmail = function(email, database) {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return null;
};

module.exports = { getUserByEmail };