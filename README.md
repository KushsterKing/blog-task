need to install mongoDB on local

npm install

run seed with the command - node app/seeds/seed_users.js

hit api http://localhost:6019/users-two

with query parameters as follows:

http://localhost:6019/users-two?paidBy=1&Amount=120&Amount=140&paidForUsers=2&paidForUsers=4

rest of the routes in routes.js file and files in modules folder are not important except for route /users-two and  module folder app/modules/users-two

npm start and run on localhost:6019
