/**
 * Common database helper functions.
 */
class DBHelper {

  static get DATABASE_NAME () {
    var name = "RestaurantReview";

    return name;
  }

  static get STORE_NAME () {
    var storeName = "restaurantsStore";

    return storeName;
  }

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const url = "http://localhost";
    const port = 1337;
    const param = "restaurants";

    return url + ":" + port + "/" + param;
  }

/**
* Dealing with reviews
*/
  static addNewReview(review) {
    console.log(review);

    let options = {
      method: "POST",
      body: JSON.stringify(review),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    fetch("http://localhost:1337/reviews", options)
      .then((response) => {
        return response.json();
      })
      .then((responseText) => {
        console.log(responseText);
      })
      .catch((error) => {
        console.log(error);

        const db = indexedDB.open(DBHelper.DATABASE_NAME, 1);

        db.onsuccess=function(event){
            const db = event.target.result;

            // return existing result from db
            const transaction = db.transaction('WAITING_SYNC','readwrite'); 
            const store = transaction.objectStore('WAITING_SYNC'); 

            store.put(review);
        };

        db.onerror = function(event) {
          console.log("Can't open indexedDB, fetch from server");
          DBHelper.fetchRestaurantsFromServer(callback);
        };
        db.onupgradeneeded = function(event) {
          const db = event.target.result;

          let restaurantStore = db.createObjectStore('WAITING_SYNC', { keyPath: "id" });
          // restaurantStore.createIndex("name", "name", { unique: true });
          // restaurantStore.createIndex("neighborhood", "neighborhood", { unique: false });

          console.log("restaurantStore created");

        };
      });

  } 

  static syncReview() {
    const db = indexedDB.open(DBHelper.DATABASE_NAME, 1);

    db.onsuccess=function(event){
        const db = event.target.result;

        // return existing result from db
        const transaction = db.transaction('WAITING_SYNC','readwrite'); 
        const store = transaction.objectStore('WAITING_SYNC'); 

        store.getAll().onsuccess = function(event) {
          const result = event.target.result;
          if (result && result.length != 0) {
            for (let review of result) {
              // console.log(review);
              DBHelper.addNewReview(review);
            }
            
            const transaction2 = db.transaction('WAITING_SYNC','readwrite'); 
            const store2 = transaction.objectStore('WAITING_SYNC'); 
            store2.clear();
          } 
        };

    };

    db.onerror = function(event) {
      console.log("Can't open indexedDB, fetch from server");
      DBHelper.fetchRestaurantsFromServer(callback);
    };
    db.onupgradeneeded = function(event) {
      const db = event.target.result;

      // create for offline sync
      db.createObjectStore('WAITING_SYNC', { keyPath: "id" });

      console.log("restaurantStore created");

    };
  }

/**
* Fetch data
*/
  static fetchRestaurantsFromServer(callback) {
    console.log("fetch from server");
    fetch(DBHelper.DATABASE_URL)
      .then(function (response) {
        return response.json();
      })
      .then(function (restaurants) {
        callback(null, restaurants);
      })
      .catch(function (error) {
        callback(error, null);
      });
  }


  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    // open data base and check for data
    const db = indexedDB.open(DBHelper.DATABASE_NAME, 1);

    db.onsuccess=function(event){
        const db = event.target.result;

        // return existing result from db
        const transaction = db.transaction(DBHelper.STORE_NAME,'readwrite'); 
        const store = transaction.objectStore(DBHelper.STORE_NAME); 

        store.getAll().onsuccess = function(event) {
          const result = event.target.result;
          if (result && result.length != 0) {
            callback(null, result);
          } else {
            // in case it is the first for the user to open this website
            DBHelper.fetchRestaurantsFromServer(callback);
          }
        };
        

        // update db
        DBHelper.fetchRestaurantsFromServer(function (err, restaurants) {
          if (err) {
            console.log("DBHelper can't fetch data from server: " + err);
          } else {
            console.log(DBHelper.STORE_NAME);
            var transaction = db.transaction(DBHelper.STORE_NAME,'readwrite'); 
            var store = transaction.objectStore(DBHelper.STORE_NAME); 

            restaurants.forEach(function(restaurant) {
              store.put(restaurant);
            });            
          }
        });

    };

    db.onerror = function(event) {
      console.log("Can't open indexedDB, fetch from server");
      DBHelper.fetchRestaurantsFromServer(callback);
    };
    db.onupgradeneeded = function(event) {
      const db = event.target.result;

      let restaurantStore = db.createObjectStore(DBHelper.STORE_NAME, { keyPath: "id" });
      restaurantStore.createIndex("name", "name", { unique: true });
      restaurantStore.createIndex("neighborhood", "neighborhood", { unique: false });

      // create for offline sync
      db.createObjectStore('WAITING_SYNC', { keyPath: "id" });

      console.log("restaurantStore created");

    };

  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant

          console.log(restaurant);
          fetch("http://localhost:1337/reviews/?restaurant_id=" + restaurant.id)
            .then(function (response) {
              return response.json();
            })
            .then(function (reviews) {
              console.log(reviews);
              restaurant["reviews"] = reviews || [];
              callback(null, restaurant);
            })
            .catch(function (error) {
              console.log(error);
            });


          // callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}
