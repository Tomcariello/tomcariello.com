# TomCariello.com

The profile page for Tom Cariello's development career.

A simple 3 page website with a fully functional custom written CMS. This site is powered by Node.js/Express with a MySQL backend.

	About: A profile image/caption & bio, all three elements are editable via the CMS.

	Portfolio: A listing of projects. Each has an image, title (hyperlinked), short explanation & link to code on github. All 4 elements within each project are editable via the CMS and  projects can be added/deleted.

	Contact: A simple form, the data submitted is stored in MySQL and presented on the Administration dashboard for easy viewing. An email is also sent to me to alert me to the message.

Technologies Used:
    bcrypt: Used to encrypt the administration password prior to storing in the database 
    handlebars: Used for templating throughout the website
    multer: Used to handle file uploads (used 'About Me' administration area)
    mysql: Data storage
    nodemailer: To send an email to me whenever someone submits the form
    passport: Session management to ensure that only the administrator can hit sensitive pages & routes
    sequelize: To simplify database reads/writes
    Summernote: WYSYWIG used on the backend for styling
    Mailgun: to alert me if a contact form is submitted


To-Do:
	Continue to polish the Administration area visually
	Add warning messages on misformed requests on login