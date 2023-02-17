const router = require("express").Router();
const { usernameVarmi, rolAdiGecerlimi } = require("./auth-middleware");
const { JWT_SECRET } = require("../secrets"); // bu secret'ı kullanın!
const UserModel = require("../users/users-model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.post("/register", rolAdiGecerlimi, async (req, res, next) => {
  /**
    [POST] /api/auth/register { "username": "anna", "password": "1234", "role_name": "angel" }
    response:
    status: 201
    {
      "user"_id: 3,
      "username": "anna",
      "role_name": "angel"
    }
   */
  try {
    const hash = bcrypt.hashSync(req.body.password, 10);

    const newUser = await UserModel.ekle({
      role_name: req.body.role_name,
      username: req.body.username,
      password: hash,
    });
    res.status(201).json(newUser);
  } catch (err) {
    next(err);
  }
});

router.post("/login", usernameVarmi, (req, res, next) => {
  /**
    [POST] /api/auth/login { "username": "sue", "password": "1234" }
    response:
    status: 200
    {
      "mesaj": "sue geri geldi!",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ETC.ETC"
    }
    Token 1 gün sonra timeout olmalıdır ve aşağıdaki bilgiyi payloadında içermelidir:
    {
      "subject"  : 1       // giriş yapan kullanıcının user_id'si
      "username" : "bob"   // giriş yapan kullanıcının username'i
      "role_name": "admin" // giriş yapan kulanıcının role adı
    }
   */
  try {
    const { password } = req.body;
    const passwordCheck = bcrypt.compareSync(password, req.user.password);

    if (passwordCheck) {
      const jwtToken = jwt.sign(
        {
          subject: req.user.user_id,
          username: req.user.username,
          role_name: req.user.role_name,
        },
        JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.status(200).json({
        success: true,
        token: jwtToken,
        message: `${req.user.username} geri geldi!`,
      });
    } else {
      next({
        status: 401,
        message: "Geçersiz kriter",
      });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
