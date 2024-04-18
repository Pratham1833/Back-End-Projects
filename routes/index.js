var express = require('express');
var router = express.Router();
const userModel = require('./users');
const postModel = require('./posts');
const passport = require('passport');
const upload = require('./multer');

const localStrategy = require('passport-local');
const { ConnectionStates } = require('mongoose');
passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.get('/login', function(req, res) {
  res.render('login', {error: req.flash('error')});
});

router.get('/feed', function(req, res) {
  res.render('feed');
});

router.post('/upload', isLoggedIn , upload.single('file') ,async function(req, res) {
  if(!req.file) {
    return res.status(400).send("No Files were uploaded.");
  }
  const user = await userModel.findOne({username: req.session.passport.user});
  const post = await postModel.create({
    image: req.file.fieldname,
    imageText: req.body.filecaption,
    user: user._id
  });

  user.posts.push(post._id);
  await user.save();
  res.send("Done");
});


router.get('/profile', isLoggedIn,  async function(req, res) {
  const user = await userModel.findOne({
    username: req.session.passport.user
  })
  .populate("posts")
  res.render("profile", {user});
});


router.post('/register', function(req , res){
  const userData = new userModel({ ...req.body });

  userModel.register(userData ,req.body.password)
  .then(function(){
    passport.authenticate("local")(req , res , function(){
      res.redirect('/profile');
    })
  })

})

router.post('/login', passport.authenticate("local",{
  successRedirect: '/profile',
  failureRedirect: '/login',
  failureFlash: true
}) ,  function(req, res) {
});

router.get('/logout' , function(req , res){
  req.logout(function(err) {
    if(err) {return next(err);}
    res.redirect('/login');
  })
})

function isLoggedIn(req, res ,next){
  if(req.isAuthenticated()) return next();
  res.redirect('/login');
}



module.exports = router;
