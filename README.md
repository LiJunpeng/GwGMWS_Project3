# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

## Project Overview: Stage 3

I have done following things in this stage:
- Add a form to restaurant.html for user to add new comments
- Add a star button for user to mark the restaurant as a favorite
- Store newly added comments into indexedDB if it was not able to access backend. The working flow is:
  1. When page loaded, check indexedDB to see if there is any pending comments. If there were pending comments, then push them to the backend.
  2. When user commit a new comment, try to push it to the backend. If cannot access backend, then store the comment into indexedDB store called 'WAITING_SYNC'. The new comment will be appended into comments list immediatelly whether or not it's online or offline.

### How to start?
1. Run a data server on port 1337. https://github.com/udacity/mws-restaurant-stage-2
2. From /web_src/public directory, run a python HTTP server
