var express = require('express');
var router = express.Router({
    mergeParams: true
});

var userRole = require('../libs/user_role');
var mail = require('../libs/mail');

var User = require('../models/user').User;
var Camp = require('../models/camp').Camp;
var NpoMember = require('../models/npo_member').NpoMember;
var NpoStatus = require('../models/npo_member').NPO_STATUS;

var config = require('config');
var npoConfig = config.get('npo');
var serverConfig = config.get('server');
var log = require('../libs/logger.js')(module);
var datatableAdmin = require('../libs/admin').datatableAdmin;
var adminRender = require('../libs/admin').adminRender;
var sign_up = require('../libs/passport').sign_up;

router.get('/', userRole.isAdmin(), function (req, res) {
    adminRender(req, res, 'admin/home.jade', {
        tiles: [
            {top: {icon: "user", title: "Total Users"}, count: {text: "250", green: false}, bottom: {title: "Users admin", href: "/admin/users"}},
            {top: {icon: "sitemap", title: "Total Camps"}, count: {text: "5", green: false}, bottom: {title: "Camps admin", href: "/admin/camps"}}
            // {top: {icon: "user", title: "Total Users"}, count: {text: "2500", green: false}, bottom: {small: "4%", sort: "", color: "green", title: "From last week"}},
            // {top: {icon: "clock-o", title: "Average Time"}, count: {text: "123.50", green: false}, bottom: {small: "3%", sort: "asc", color: "green", title: "From last week"}},
            // {top: {icon: "user", title: "Total Males"}, count: {text: "2,500", green: true}, bottom: {small: "34%", sort: "asc", color: "green", title: "From last week"}},
            // {top: {icon: "user", title: "Total Females"}, count: {text: "4,567", green: false}, bottom: {small: "12%", sort: "desc", color: "red", title: "From last week"}},
            // {top: {icon: "user", title: "Total Collections"}, count: {text: "2,315", green: false}, bottom: {small: "4%", sort: "asc", color: "green", title: "From last week"}},
            // {top: {icon: "user", title: "Total Connections"}, count: {text: "7,325", green: false}, bottom: {small: "56%", sort: "asc", color: "green", title: "From last week"}}
        ]
    });
});

datatableAdmin("users", router, {
    "model": User,
    "columns": [
        {title: "Id", attr: "user_id", type: "primary"},
        {title: "Email", attr: "email", type: "string"},
        {title: "First name", attr: "first_name", type: "string"},
        {title: "Last name", attr: "last_name", type: "string"},
        {title: "Roles", attr: "roles", type: "string"}
    ],
    selectColumns: ["user_id", "email", "first_name", "last_name", "roles"],
    defaultOrder: [[ 1, "asc" ]],
    filter: function(qb, searchTerm) {
        qb
            .where('email', 'LIKE', '%'+searchTerm+'%')
            .orWhere('first_name', 'LIKE', '%'+searchTerm+'%')
            .orWhere('last_name', 'LIKE', '%'+searchTerm+'%')
        ;
        if (!isNaN(searchTerm)) {
            qb.orWhere('user_id', '=', searchTerm)
        }
    },
    addTitle: "Add User",
    addCallback: function(body, done) {
        sign_up(body.email, "spark", body, function(user, error) {
            if (user) {
                done(true, "Great Success! 1 user added");
            } else {
                done(false, error);
            }
        });
    },
    editTitle: "Edit User",
    editKey: "user_id",
    editCallback: function(user_id, body, done) {
        User.forge({user_id:user_id}).save(body).then(function() {
            done(true, "Great success! updated user id "+user_id);
        }).catch(function(e) {
            done(false, "unexpected error: "+e);
        });
    }
});

datatableAdmin("camps", router, {
    "model": Camp,
    "columns": [
        {title: "Id", attr: "id", type: "primary"},
        {title: "Camp name (HE)", attr: "camp_name_he", type: "string"},
        {title: "Camp name (EN)", attr: "camp_name_en", type: "string"},
        {title: "Camp desc (HE)", attr: "camp_desc_he", type: "string"},
        {title: "Camp desc (EN)", attr: "camp_desc_en", type: "string"},
        {title: "Type", attr: "type", type: "string"},
        {title: "Status", attr: "status", type: "string"},
        {title: "Published", attr: "web_published", type: "string"}
    ],
    selectColumns: ["id", "camp_name_he", "camp_name_en", "camp_desc_he", "camp_desc_en", "type", "status", "web_published"],
    defaultOrder: [[ 1, "asc" ]],
    filter: function(qb, searchTerm) {
        qb
            .where('camp_name_he', 'LIKE', '%'+searchTerm+'%')
            .orWhere('camp_name_en', 'LIKE', '%'+searchTerm+'%')
            .orWhere('camp_desc_he', 'LIKE', '%'+searchTerm+'%')
            .orWhere('camp_desc_en', 'LIKE', '%'+searchTerm+'%')
        ;
        if (!isNaN(searchTerm)) {
            qb.orWhere('id', '=', searchTerm)
        }
    },
    addTitle: "Add Camp",
    addCallback: function(body, done) {
        Camp.forge().save(body).then(function() {
            done(true, "Great success! 1 camp added");
        }).catch(function(e) {
            done(false, "unexpected error: "+e);
        });
    },
    editTitle: "Edit Camp",
    editKey: "id",
    editCallback: function(camp_id, body, done) {
        Camp.forge({camp_id:camp_id}).save(body).then(function() {
            done(true, "Great success! updated camp id "+camp_id);
        }).catch(function(e) {
            done(false, "unexpected error: "+e);
        });
    }
});

router.get('/npo', userRole.isAdmin(), function (req, res) {
    NpoMember.forge().query({where: {membership_status: NpoStatus.applied_for_membership}})
        .fetchAll({withRelated: ['user']}).then(function (members) {
        res.render('admin/npo.jade', {members: members.models});
    });
});

router.get('/npo', userRole.isAdmin(), function (req, res, next) {
    NpoMember.forge().query({
            where: {
                membership_status: NpoStatus.applied_for_membership
            }
        })
        .fetchAll({
            withRelated: ['user']
        }).then(function (members) {
            res.render('admin/npo.jade', {
                members: members.models
            });
        });
});

router.post('/npo', userRole.isAdmin(), function (req, res, next) {
    if (req.body.action && req.body.emails) {
        switch (req.body.action) {
            case 'approve_membership':
                var rows = req.body.emails.split('\n');
                rows.forEach(function (row) {
                    var recipient = row.trim();
                    if (recipient.length > 0) {
                        new User({
                            email: recipient
                        }).fetch().then(function (theUser) {
                            if (theUser == null) {
                                //TODO handle error.
                                log.error("User not found!");
                                return res.render('admin/admin_npo', {
                                    errorMessage: 'email ' + recipient + ' not found'
                                });
                            }
                            if (theUser.attributes.membership_status === npoStatus.applied_for_membership) {
                                theUser.attributes.membership_status = npoStatus.request_approved;
                                theUser.save().then(function (model) {
                                    var payLink = serverConfig.url + "/he/npo/pay_fee?user='" + recipient;
                                    mail.send(
                                        recipient,
                                        npoConfig.email,
                                        'Your Midburn membership approved!',
                                        'emails/npo_membership_approved', {
                                            name: theUser.fullName,
                                            payLink: payLink
                                        });
                                    res.redirect('/admin/npo');
                                });
                            } else {
                                //TODO handle error.
                                log.warn("Incorrect status - ", theUser.attributes.membership_status);
                                return res.render('admin/admin_npo', {
                                    errorMessage: 'email ' + recipient + ' - incorrect status'
                                });
                            }
                        });
                    }
                })
        }
    }
});

module.exports = router;
