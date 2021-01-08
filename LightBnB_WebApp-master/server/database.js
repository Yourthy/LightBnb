const properties = require('./json/properties.json');
const users = require('./json/users.json');
const {Pool} = require('pg');
const { query } = require('express');


const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});


/// Users



////////////////////////////////////////////
//          GET USER WITH EMAIL           //
////////////////////////////////////////////
/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool.query(`
  SELECT * 
  FROM users
  WHERE email = $1
  `, [email]).then(res => { 
    if(res.rows.length === 0){
      return null;
    }
    return res.rows[0]
  }).catch((error)=>{
    return null;
  })
}
exports.getUserWithEmail = getUserWithEmail;

////////////////////////////////////////////
//          GET USER WITH ID              //
////////////////////////////////////////////
/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool.query(`
  SELECT * FROM users
  WHERE id = $1;
  `, [id]).then(res =>{
    if(res.rows.length === 0){
      return null;
    }
    return res.rows[0];
    }).catch(error => {
      console.log(error);
    })
  }
  
exports.getUserWithId = getUserWithId;


////////////////////////////////////////////
//          ADD USER                      //
////////////////////////////////////////////
/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
return pool.query(`
  INSERT INTO users (name, email, password)
  VALUES ($1, $2, $3)
  RETURNING *
`, [user.name, user.email, user.password]).then(res => {
  return res.rows[0];
}).catch((error) =>{
  console.log(error);
})
}
exports.addUser = addUser;

/// Reservations

////////////////////////////////////////////
//          GET ALL RESERVATIONS          //
////////////////////////////////////////////
/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool.query(`
  SELECT properties.*, reservations.*, avg(rating) as average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id 
  WHERE reservations.guest_id = $1
  AND reservations.end_date < now()::date
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT $2;
  `, [guest_id, limit]).then(res=>{
    return res.rows; 
  }).catch((error)=>{
    console.log(error);
  })
}
exports.getAllReservations = getAllReservations;

/// Properties

////////////////////////////////////////////
//          GET ALL PROPERTIES            //
////////////////////////////////////////////
/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
// const getAllProperties = function(options, limit) {
//   return pool.query(`
//   SELECT * FROM properties
//   LIMIT $1;
//   `, [limit]).then(res => {
//     return res.rows;
// })
// }
const getAllProperties = function(options, limit = 10) {
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  if(options.owner_id){
    queryParams.push(`%${options.owner_id}%`);
    if(query.Params.length === 1){
      queryString += `WHERE owner_id = ${options.properties.id}`;
    }else{
      queryString += `AND  owner_id = ${options.properties.id}`;
    }
  }

  if(options.minimum_price_per_night && options.maximum_price_per_night){
    queryParams.push(options.minimum_price_per_night * 100, options.maximum_price_per_night * 100);
    if(queryParams.length === 2){
      queryString += `WHERE cost_per_night >= $${queryParams.length -1} AND cost_per_night <= $${queryParams.length}`;
    }else{
      queryString += `AND cost_per_night >= $${queryParams.length -1} AND cost_per_night <= $${queryParams.length}`;
    }
  }

  if(options.minimum_rating){
    queryParams.push(options.minimum_rating)
    queryString += `HAVING avg(property_reviews.rating) >= $${queryParmas.length}`
  }

  // 4
  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  // 5
  console.log(queryString, queryParams);

  // 6
  return pool.query(queryString, queryParams)
  .then(res => res.rows);
}



exports.getAllProperties = getAllProperties;


////////////////////////////////////////////
//          ADD PROPERTY                  //
////////////////////////////////////////////
/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;


