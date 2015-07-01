var pwdMgr = require('./managePasswords');
var validateRequest = require("../auth/validateRequest");
var config = require("../config");

module.exports = function(server, db, nodemailer) {

    var base = "http://localhost:8100/#/newPassword?token=";
    //variable transporter para el acceso a la cuenta remitente
    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: config.mailer.auth.user,
            pass: config.mailer.auth.pass
        }
    });


    //########################################################################################### 

    server.post('/registrar', function(req, res, next) {
        var user = req.params;
        db.usuarios.findOne({
            //_id: req.params._id
            email: req.params.email
        }, function(err, dbUser) {
            console.log(dbUser);
            if (dbUser) {

                res.writeHead(403, {
                    'Content-Type': 'application/json; charset=utf-8'
                });
                res.end(JSON.stringify({
                    error: "El usuario ya existe"
                }));
            } else {
                pwdMgr.cryptPassword(user.contrasena, function(err, hash) {
                    user.contrasena = hash;
                    console.log("n", hash);
                    db.usuarios.insert(user,
                        function(err, dbUser) {

                            if (err) {
                                res.writeHead(400, {
                                    'Content-Type': 'application/json; charset=utf-8'
                                });
                                res.end(JSON.stringify({
                                    error: err,
                                    message: "Ooops Error inesperado, por favor intente más tarde"
                                }));

                            } else {
                                res.writeHead(200, {
                                    'Content-Type': 'application/json; charset=utf-8'
                                });
                                dbUser.contrasena = "";
                                res.end(JSON.stringify(dbUser));
                            }
                        });
                });
            }
        });
        return next();
    });



    //########################################################################################### 
    server.post('/login', function(req, res, next) {

        console.log('Server login')
        console.log(req.params.email)
        console.log(req.params.contrasena)


        var user = req.params;
        if (user.email.trim().length == 0 || user.contrasena.trim().length == 0) {
            res.writeHead(403, {
                'Content-Type': 'application/json; charset=utf-8'
            });
            res.end(JSON.stringify({
                error: "Credenciales inválidas"
            }));
        }
        console.log("in");
        db.usuarios.findOne({
            //_id: req.params.email
            email: req.params.email
        }, function(err, dbUser) {

            if (!dbUser) {
                res.writeHead(403, {
                    'Content-Type': 'application/json; charset=utf-8'
                });
                res.end(JSON.stringify({
                    error: "Usuario inválido"
                }));
            }


            pwdMgr.comparePassword(user.contrasena, dbUser.contrasena, function(err, isPasswordMatch) {


                console.log(isPasswordMatch)

                if (isPasswordMatch) {
                    res.writeHead(200, {
                        'Content-Type': 'application/json; charset=utf-8'
                    });
                    // remove password hash before sending to the client
                    dbUser.contrasena = "";
                    res.end(JSON.stringify(dbUser));
                } else {
                    res.writeHead(403, {
                        'Content-Type': 'application/json; charset=utf-8'
                    });
                    res.end(JSON.stringify({
                        error: "Contraseña Inválida"
                    }));
                }

            });
        });
        return next();
    });

    //########################################################################################### 
    server.get("/list", function(req, res, next) {
        console.log("entró al métogo get");
        validateRequest.validate(req, res, db, function() {
            db.usuarios.find({
                _id: db.ObjectId(req.params.token)
            }, function(err, list) {
                res.writeHead(200, {
                    'Content-Type': 'application/json; charset=utf-8'
                });
                res.end(JSON.stringify(list));
            });
        });
        return next();
    });



    //###############################################################################################

    server.put('/modificarDatos', function(req, res, next) {
        validateRequest.validate(req, res, db, function() {
            var user = req.params;

            console.log(user);
            db.usuarios.findOne({
                // _id: req.params.token
                _id: db.ObjectId(req.params.token)
            }, function(err, data) {
                pwdMgr.comparePassword(user.contrasena, data.contrasena, function(err, isPasswordMatch) {
                    if (isPasswordMatch) {
                        console.log('contraseñas coinciden');
                        db.usuarios.update({
                            //_id: req.params.token
                            _id: db.ObjectId(req.params.token)
                        }, {
                            $set: {
                                /* nombre: user.nombre,
                                 apellido: user.apellido,
                                 genero: user.genero*/
                                email: user.email

                            }
                        }, {
                            multi: false
                        }, function(err, data) {
                            res.writeHead(200, {
                                'Content-Type': 'application/json; charset=utf-8'
                            });
                            res.end(JSON.stringify(data));
                        });
                    } else {
                        res.writeHead(403, {
                            'Content-Type': 'application/json; charset=utf-8'
                        });
                        res.end(JSON.stringify({
                            error: "Contraseña Inválida"
                        }));
                    }
                });
            });
        });
        return next();
    });

    //###############################################################################################################

    server.put('/modificarContrasena', function(req, res, next) {
        validateRequest.validate(req, res, db, function() {
            var user = req.params;

            console.log(user);
            db.usuarios.findOne({
                _id: db.ObjectId(req.params.token)
            }, function(err, data) {
                pwdMgr.comparePassword(user.contrasena, data.contrasena, function(err, isPasswordMatch) {
                    if (isPasswordMatch) {
                        console.log('contraseñas coinciden');

                        pwdMgr.cryptPassword(user.contrasenaNueva, function(err, hash) {
                            user.contrasenaNueva = hash;
                            db.usuarios.update({
                                _id: db.ObjectId(req.params.token)
                            }, {
                                $set: {
                                    contrasena: user.contrasenaNueva

                                }
                            }, {
                                multi: false
                            }, function(err, data) {
                                res.writeHead(200, {
                                    'Content-Type': 'application/json; charset=utf-8'
                                });
                                res.end(JSON.stringify(data));
                            });
                        });
                    } else {
                        res.writeHead(403, {
                            'Content-Type': 'application/json; charset=utf-8'
                        });
                        res.end(JSON.stringify({
                            error: "Contraseña Inválida"
                        }));
                    }
                });
            });
        });
        return next();
    });

    //#######################################################################################


    server.get('/infoUser', function(req, res, next) {
        validateRequest.validate(req, res, db, function() {
            db.usuarios.find({
                _id: db.ObjectId(req.params.token)
            }, function(err, data) {
                res.writeHead(200, {
                    'Content-Type': 'application/json; charset=utf-8'
                });
                res.end(JSON.stringify(data));
            });
        });
        return next();
    });
    //########################################################################################

    server.post('/resetPassword', function(req, res, next) {
        var user = req.params;
        console.log(user);
        db.usuarios.findOne({
            // _id: req.params.email
            email: req.params.email
        }, function(err, dbUser) {
            console.log(dbUser);
            if (!dbUser) {
                res.writeHead(403, {
                    'Content-Type': 'application/json; charset=utf-8'
                });
                res.end(JSON.stringify({
                    error: "No existe un usuario registrado con este email"
                }));
            } else {

                var clave = makeid();
                console.log(clave);
                var pToken = {
                    token: clave,
                    fechaCreacion: new Date() //Mirar restar fechas :D
                };
                console.log(dbUser._id);

                db.usuarios.update({
                    _id: db.ObjectId(dbUser._id)
                }, {
                    $set: {
                        passwordToken: pToken
                    }
                }, {
                    multi: false
                }, function(err, data) {
                    res.writeHead(200, {
                        'Content-Type': 'application/json; charset=utf-8'
                    });
                    res.end(JSON.stringify(data));
                });

                //Enviar correo


                var mailOptions = {
                    from: config.mailer.defaultFromAddress, // sender address
                    to: dbUser.email, // list of receivers
                    subject: 'Recuperar contraseña ✔', // Subject line
                    html: config.mailer.msj + clave + config.mailer.msj2
                        //text: 'Hola, ' + dbUser.nombre + ', con este correo podrás reestablecer tu password.'
                };

                transporter.sendMail(mailOptions, function(error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Message sent: ' + info.response);
                    }
                });
            }
        });
        return next();

    });

    //#################################################################################################################
    function makeid() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 5; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    //############################################################################################################

    server.post('/newPassword', function(req, res, next) {
        var user = req.params;
        //console.log("in");
        db.usuarios.findOne({
            // _id: req.params.email
            _id: db.ObjectId(req.params.id)
        }, function(err, dbUser) {

            if (!dbUser) {
                res.writeHead(403, {
                    'Content-Type': 'application/json; charset=utf-8'
                });
                res.end(JSON.stringify({
                    error: "No existe un usuario registrado con este email"
                }));
            } else {
                pwdMgr.cryptPassword(user.contrasena, function(err, hash) {
                    user.contrasena = hash;
                db.usuarios.update({
                    _id: db.ObjectId(dbUser._id)
                }, {
                    $set: {
                        contrasena: user.contrasena
                    }
                }, {
                    multi: false
                }, function(err, data) {
                    res.writeHead(200, {
                        'Content-Type': 'application/json; charset=utf-8'
                    });
                    console.log(dbUser);
                    res.end(JSON.stringify(data));
                });
            });
            }
        });
        return next();

    });

    //########################################################################################

    server.post('/codigo', function(req, res, next) {
        var user = req.params;
        //console.log("in");
        db.usuarios.findOne({
            // _id: req.params.email
            "passwordToken.token": req.params.token
        }, function(err, dbUser) {

            if (!dbUser) {
                res.writeHead(403, {
                    'Content-Type': 'application/json; charset=utf-8'
                });
                res.end(JSON.stringify({
                    error: "Código incorrecto"
                }));
            } else {
                var fecha = dbUser.passwordToken.fechaCreacion;
                var fechaAct = new Date();
                var tiempo = (fechaAct - fecha) / 1000;
                db.usuarios.update({
                    _id: db.ObjectId(dbUser._id)
                }, {
                    $unset: {
                        passwordToken: 1
                    }
                }, {
                    multi: false
                }, function(err, data) {
                    if (tiempo < 300) {
                        res.writeHead(200, {
                            'Content-Type': 'application/json; charset=utf-8'
                        });

                        res.end(JSON.stringify(dbUser));
                    } else {
                        res.writeHead(403, {
                            'Content-Type': 'application/json; charset=utf-8'
                        });
                        res.end(JSON.stringify({
                            error: "Su Código ha expirado, por favor genere uno nuevo"
                        }));

                    }

                });

            }

        });
        return next();

    });

};