# Traveling-Social-Network-Project

In this project we have built a frontend and a backend for a mini traveling social network.

The system supports the following features:
  
  - Secured login and registration:
 ![Alt text](/demo_images/login.png?raw=true "Login Page")
  - Posts feed:
 ![Alt text](/demo_images/postfeed1.png?raw=true "Posts Feed 1")
 ![Alt text](/demo_images/postfeed2.png?raw=true "Posts Feed 2")
  - Posts editing, deleting and subscription:
 ![Alt text](/demo_images/editpost.png?raw=true "Posts Editing")
  - Adding new post:
 ![Alt text](/demo_images/createpost.png?raw=true "New Post")
  - Viewing users' info including followers and followed:
 ![Alt text](/demo_images/userInfo.png?raw=true "Users info")
  - Users search (with autocompletion):<br/>
 ![Alt text](/demo_images/userSearch.png?raw=true "Users search")
  - Notifications: <br/>
 ![Alt text](/demo_images/notifications.png?raw=true "Notifications")
  - Map search for potential trip partners (by dates, point on map and radius):
 ![Alt text](/demo_images/mapSearch.png?raw=true "Map Search")


  ### Installation
    
  Install local postgresql DB. Make sure to set the following fields on set-up as follows:
  
  > username: postgres
  
  > password: technion
  
  > port: 5432
  
  > DB name: myDB
  
  Install the backend dependencies and start the server:
  
```sh
$ conda env create -f environment.yml
$ conda activate web_course
$ python main.py
```
  
  Install the frontend dependencies and start the frontend:

```sh
$ cd frontend
$ npm install 
$ npm run start
```
