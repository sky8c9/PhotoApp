## Setup
- Install Node JS - https://nodejs.org/en/download/
- Install MongoDB - https://docs.mongodb.com/manual/administration/install-community/
- Install Redis - https://redis.io/download

## Run
- Fetch node modules to PhotoApp folder
  ```
  npm install
  ```

- Start MongoDB - See https://docs.mongodb.com/manual/administration/install-community/

- Start redis server
  ```
  redis-server
  ```
  
- Run webserver
  ```
  node webServer.js
  ```

- Load predefined dataset
  ```
  node loadDatabase.js
  ```

- Access app via
  ```
  http://localhost:3000/photo-share.html
  ```

- Tools & functionalities - See demos under App_Demo folder
