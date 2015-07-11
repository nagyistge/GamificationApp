module.exports = function(server, db) {
    var validateRequest = require("../auth/validateRequest");

    server.get("/preguntas", function(req, res, next) {
        validateRequest.validate(req, res, db, function() {
            db.preguntas.find(function(err, list) {
                res.writeHead(200, {
                    'Content-Type': 'application/json; charset=utf-8'
                });
                console.log(list);
                res.end(JSON.stringify(list));
            });
        });
        return next();
    });
    //#####################################################################
    server.get("/verificarPregunta", function(req, res, next) {
        validateRequest.validate(req, res, db, function() {
            var bandera = false;
            db.preguntas.find({
                    $or: [{
                        miembros_id: db.ObjectId(req.params.token)
                    }, {
                        autor_id: db.ObjectId(req.params.token)
                    }]
                },
                function(err, datos) {
                    console.log(datos.length);
                    if (datos.length == 0) {
                        bandera = true;

                    } else {
                        bandera = true;

                        for (var i = 0; i < datos.length; i++) {
                            if (datos[i].finalizado == false) {
                                bandera = false;
                                break;
                            }
                        }

                    }
                    if (bandera) {
                        console.log("puede publicar");
                        res.writeHead(200, {
                            'Content-Type': 'application/json; charset=utf-8'
                        });
                        res.end(JSON.stringify({
                            message: "El usuario puede publicar una pregunta"
                        }));

                    } else {
                        console.log("puede publicar");
                        res.writeHead(403, {
                            'Content-Type': 'application/json; charset=utf-8'
                        });
                        res.end(JSON.stringify({
                            error: "El usuario tiene investigaciones en curso"
                        }));
                    }

                });
        });
        return next();
    });

    //##########################################################################################
    server.post("/anadirPregunta", function(req, res, next) {
        validateRequest.validate(req, res, db, function() {
            var pregunta = req.params;
            console.log(pregunta);
            db.preguntas.insert({
                    titulo: pregunta.titulo,
                    descripcion: pregunta.descripcion,
                    fechaLimite: pregunta.fechaLimite,
                    autor_id: db.ObjectId(pregunta.token),
                    miembros_id: [],
                    finalizado: false
                },
                function(err, dbPregunta) {

                    if (err) {
                        res.writeHead(400, {
                            'Content-Type': 'application/json; charset=utf-8'
                        });
                        res.end(JSON.stringify({
                            error: err,
                            message: "Ooops Error inesperado, por favor intente más tarde"
                        }));

                    } else {

                        db.usuarios.update({
                            _id: db.ObjectId(req.params.token)
                        }, {
                            $inc: {
                                puntos: 15
                            }
                        }, function(err, data) {
                            res.writeHead(200, {
                                'Content-Type': 'application/json; charset=utf-8'
                            });
                            res.end(JSON.stringify(data));
                        });

                    }
                });
        });
        return next();
    });
    //####################################################################################################
    server.post("/unirseProblema", function(req, res, next) {
        validateRequest.validate(req, res, db, function() {
            console.log(req.params);
            db.preguntas.findOne({
                _id: db.ObjectId(req.params._id)
            }, function(err, problema) {
                console.log(problema);
                if (problema) {
                    if (problema.miembros_id.length < 2) {
                        db.preguntas.update({
                            _id: db.ObjectId(req.params._id)
                        }, {
                            $addToSet: {
                                miembros_id: db.ObjectId(req.params.token)

                            }
                        }, {
                            multi: false
                        }, function(err, data) {
                            db.usuarios.update({
                                _id: db.ObjectId(req.params.token)
                            }, {
                                $inc: {
                                    puntos: 10
                                }
                            }, function(err, data) {
                                res.writeHead(200, {
                                    'Content-Type': 'application/json; charset=utf-8'
                                });
                                res.end(JSON.stringify(data));
                            });
                        });
                    } else {
                        res.writeHead(400, {
                            'Content-Type': 'application/json; charset=utf-8'
                        });
                        res.end(JSON.stringify({
                            error: "El problema ya tiene 2 usuarios unidos"
                        }));

                    }
                }
            });
        });
        return next();
    });

    //####################################################################################################    

    server.get("/nuevoReto", function(req, res, next) {
        validateRequest.validate(req, res, db, function() {
            db.usuarios.update({
                _id: db.ObjectId(req.params.token)
            }, {
                $inc: {
                    puntos: 5
                }
            }, function(err, data) {
                res.writeHead(200, {
                    'Content-Type': 'application/json; charset=utf-8'
                });
                res.end(JSON.stringify(data));
            });
        });
        return next();
    });

    //#######################################################################################################


    server.get("/verObjetivos", function(req, res, next) {
        var bandera = false;
        validateRequest.validate(req, res, db, function() {
            db.preguntas.find({
                    $or: [{
                        miembros_id: db.ObjectId(req.params.token)
                    }, {
                        autor_id: db.ObjectId(req.params.token)
                    }]
                },
                function(err, datos) {
                    console.log(datos.length);
                    if (datos.length == 0) {
                        res.writeHead(400, {
                            'Content-Type': 'application/json; charset=utf-8'
                        });
                        res.end(JSON.stringify({
                            error: "El usuario no tiene un problema asociado"
                        }));
                    } else {
                        for (var i = 0; i < datos.length; i++) {
                            if (datos[i].finalizado == false) {
                                bandera = true;
                                break;
                            }
                        }

                        if (bandera) {
                            console.log(i);
                            db.objetivos.find({
                                problema_id: db.ObjectId(datos[i]._id)
                            }, function(err, list) {
                                res.writeHead(200, {
                                    'Content-Type': 'application/json; charset=utf-8'
                                });
                                console.log(list);
                                res.end(JSON.stringify(list));
                            });
                        }

                    }


                });
        });
        return next();
    });
    //###############################################################################################

    server.post("/votarObjetivo", function(req, res, next) {
        validateRequest.validate(req, res, db, function() {
            console.log(req.params);
            db.objetivos.findOne({
                _id: db.ObjectId(req.params._id)
            }, function(err, objetivo) {
                db.objetivos.update({
                    _id: db.ObjectId(req.params._id)
                }, {
                    $inc: {
                        votos: req.params.votos
                    }
                }, function(err, data) {
                    console.log(data);
                    res.writeHead(200, {
                        'Content-Type': 'application/json; charset=utf-8'
                    });
                    res.end(JSON.stringify(data));
                });

            });
        });
        return next();
    });
}
