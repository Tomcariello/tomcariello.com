# TomCariello.com

Tom Cariello's "profile" page. Initially created as a portfolio, evolving towards jus stuff I'm interested in & technologies I want to explore.

The website with a fully functional, custom written CMS. The site is powered by Node.js/Express with a MySQL backend. Each page is dynamically served from the database & each field is editable via the CMS.

	About: A profile image/caption & bio.

	Portfolio: A listing of projects. Each has an image, title, short explanation & link to code on github.

    Puzzles: WIP. Database driven list of Springbok puzzles. Will become more dynamic, interesting & useful as I find time.

	Contact: A simple form, the data submitted is stored in MySQL and presented on the Administration dashboard for easy viewing. An email is also sent to alert me to the message. Currently down because Mailgun nuked my account.

Technologies Used:  
    - **bcrypt**: Used to encrypt the administration password prior to storing in the database  
    - **handlebars**: Used for templating throughout the website  
    - **multer**: Used to handle image file uploads  
    - **mySQL**: Data storage  
    - **nodemailer**: To send an email to me whenever someone submits the form  
    - **passport**: Session management to ensure that only the administrator can hit sensitive pages & routes  
    - **Sequelize**: To simplify database reads/writes  
    - **Summernote**: WYSYWIG used on the backend for styling  

To-Do:
	- Polish the Administration area visually  
	- Add warning messages on misformed requests on login  
    - Re-activate contact form with a different email provider  
    - Make puzzle filters functional  
    - Create Admin puzzle page(s) to allow editing & image upload of each puzzle  
    - Add pictures for target puzzles  
    - Activate puzzle-detail page  
