let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });

  // check if there reviews to be sync
  DBHelper.syncReview();
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

console.log(restaurant);
// console.log(restaurant.is_favorite == "true");
  const favorite = document.getElementById("restaurant-favorite-img");
  if (restaurant.is_favorite == "true") {
    favorite.src = "/img/starred.png";
  } else {
    favorite.src = "/img/notStarred.png";
  }

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.setAttribute("tabindex", "0");  // add tabindex for TABing through

  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = new Date(review.createdAt).toDateString();
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  li.setAttribute("aria-current", "page");  // add aria-role 
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}



// dealing with new review
let reviewForm = this.document.getElementById('new-review-form');
reviewForm.addEventListener('submit', function (event) {
  event.preventDefault();
  let restaurant_id = getParameterByName('id');
  let name = document.getElementById('form-name').value;
  let date = new Date();
  let rating = document.getElementById('form-rating').value;
  let comments = document.getElementById('form-comments').value;

  // validate review
  if (name && rating && comments) {
    let count = (self.restaurant && self.restaurant.reviews) ? self.restaurant.reviews.length : 0;

    let newReview = {
      id: count + 1,
      restaurant_id: restaurant_id,
      name: name,
      createdAt: date,
      rating: rating,
      comments: comments
    };

    DBHelper.addNewReview(newReview);

    // fill review
    self.restaurant.reviews = self.restaurant.reviews || [];
    self.restaurant.reviews.push(newReview);
    console.log(self.restaurant);
    document.getElementById("reviews-container").innerHTML = "<ul id=\"reviews-list\"></ul>";
    fillReviewsHTML();

  } else {
    alert("Please fill all fields!");
  }

});


// like
toggle = () => {
  if (self.restaurant.is_favorite == true) {
    DBHelper.toggleFavorite(self.restaurant, false, function (result) {
      self.restaurant.is_favorite = false;
      document.getElementById("restaurant-favorite-img").src="/img/notStarred.png";
    });
  } else {
    DBHelper.toggleFavorite(self.restaurant, true, function (result) {
      self.restaurant.is_favorite = true;
      document.getElementById("restaurant-favorite-img").src="/img/starred.png";
    });
  }
}

