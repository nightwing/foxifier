loginManager = Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager);

var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",
	                                             Ci.nsILoginInfo, "init");
	       
 

ps=.split(',')
us=.split(',')
hostname='https://www.google.com'
formSubmitURL=hostname
var httprealm=null
usernameField='Email'
passwordField='Passwd'
for(var i in ps){
	var loginInfo = new nsLoginInfo(hostname, formSubmitURL, httprealm,
                                    us[i], ps[i],
	                                usernameField, passwordField);
	try{
		loginManager.addLogin(loginInfo)
	}catch(e){}
}


x=loginManager.getAllLogins().map(function(x){
	return [
		x.hostname,
		x.formSubmitURL,
		x.httpRealm,
		x.username,
		x.password,
		x.usernameField,
		x.passwordField
	]
})


var nsLoginInfo2 = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1", Ci.nsILoginInfo);
str="[[\"http://www.paybox.me\",\"https://www.paybox.me\",null,\"anime\",\"chemasi\",\"username\",\"password\"],[\"https://twitter.com\",\"https://twitter.com\",null,\"aninesem\",\"es4emhishumimpassword@\",\"session[username_or_email]\",\"session[password]\"],[\"https://www.paybox.me\",\"https://www.paybox.me\",null,\"anime\",\"urishpassworda\",\"username\",\"password\"],[\"http://naduel.ru\",\"http://naduel.ru\",null,\"Anin\",\"chaprjak\",\"login\",\"password\"],[\"http://beautydar.cc\",\"http://beautydar.cc\",null,\"Ani\",\"chaprjak\",\"user\",\"passwrd\"],[\"http://digg.com\",\"http://digg.com\",null,\"Ani\",\"gaghtniqa\",\"register-username\",\"password-register\"],[\"http://digg.com\",\"http://digg.com\",null,\"Anime\",\"gaghtniqa\",\"register-username\",\"password-register\"],[\"http://twitter.com\",\"https://twitter.com\",null,\"aninesem\",\"es4emhishumimpassword@\",\"session[username_or_email]\",\"session[password]\"],[\"https://github.com\",\"https://github.com\",null,\"amirjanyan@gmail.com\",\"pass2word\",\"login\",\"password\"],[\"https://addons.mozilla.org\",\"https://addons.mozilla.org\",null,\"amirjanyan@gmail.com\",\"pass2word\",\"data[Login][email]\",\"data[Login][password]\"],[\"https://profreg.medscape.com\",\"https://profreg.medscape.com\",null,\"\",\"139726845\",\"\",\"password\"],[\"http://free-torrents.org\",\"http://free-torrents.org\",null,\"chromenta\",\"139726845\",\"login_username\",\"login_password\"],[\"http://www.pgdp.net\",\"http://www.pgdp.net\",null,\"chromenta\",\"password\",\"userNM\",\"userPW\"],[\"https://bugzilla.mozilla.org\",\"https://bugzilla.mozilla.org\",null,\"amirjanyan@gmail.com\",\"password\",\"Bugzilla_login\",\"Bugzilla_password\"],[\"http://dwsc.gcn.icon.am\",\"http://dwsc.gcn.icon.am\",null,\"dasann\",\"286528\",\"username\",\"password\"],[\"https://cabinet.mts.am\",\"https://cabinet.mts.am\",null,\"556325\",\"nwGHgjdU\",\"ctl00$MainContent2$txtGsmNumber\",\"ctl00$MainContent2$txtPassword\"],[\"http://www.nytimes.com\",\"http://www.nytimes.com\",null,\"amirjanyan@gmail.com\",\"password\",\"email\",\"passwd1\"],[\"https://myaccount.nytimes.com\",\"https://myaccount.nytimes.com\",null,\"amirjanyan@gmail.com\",\"password\",\"userid\",\"password\"],[\"http://freebirdgames.com\",\"http://freebirdgames.com\",null,\"blackadder\",\"139726845\",\"user\",\"passwrd\"],[\"http://www.facebook.com\",\"http://www.facebook.com\",null,\"chromenta@gmail.com\",\"pass2word\",\"reg_email_confirmation__\",\"reg_passwd__\"],[\"http://www.facebook.com\",\"https://login.facebook.com\",null,\"\",\"pass2word\",\"\",\"pass\"],[\"http://www.muziboo.com\",\"http://www.muziboo.com\",null,\"chromenta@gmail.com\",\"pass2word\",\"user[email]\",\"user[password]\"],[\"http://lists.pglaf.org\",\"http://lists.pglaf.org\",null,\"\",\"password\",\"fullname\",\"pw\"],[\"https://www.geni.com\",\"https://www.geni.com\",null,\"amirjanyan@gmail.com\",\"password\",\"profile[username]\",\"profile[password]\"],[\"https://shiftedit.net\",\"https://shiftedit.net\",null,\"amirjanyanani@gmail.com\",\"password\",\"email\",\"password\"],[\"https://shiftedit.net\",\"https://shiftedit.net\",null,\"amirjanyan@gmail.com\",\"mct53s\",\"email\",\"password\"],[\"http://www.projectdirigible.com\",\"http://www.projectdirigible.com\",null,\"amirjanyan@gmail.com\",\"password\",\"email\",\"password1\"],[\"http://thelonghorn.nu\",\"http://thelonghorn.nu\",null,\"blackadder\",\"password\",\"login_name\",\"login_password\"],[\"http://mechins.sci.am\",\"http://mechins.sci.am\",null,\"harutyun\",\"1368161836\",\"kerio_username\",\"kerio_password\"],[\"http://www.virtapay.com\",\"https://www.virtapay.com\",null,\"anime\",\"4emasi\",\"username\",\"password\"],[\"https://www.virtapay.com\",\"https://www.virtapay.com\",null,\"anime\",\"chemasi\",\"username\",\"password\"],[\"http://www.freebirdgames.com\",\"http://freebirdgames.com\",null,\"blackadder\",\"139726845\",\"user\",\"passwrd\"],[\"http://igrayvmeste.ru\",\"http://igrayvmeste.ru\",null,\"Anin\",\"CHAPRJAK\",\"login\",\"password\"],[\"http://dev.estivo.de\",\"http://dev.estivo.de\",null,\"blackadder\",\"password\",\"user_name\",\"password\"],[\"http://www.facebook.com\",\"https://www.facebook.com\",null,\"chromenta@gmail.com\",\"pass2word\",\"email\",\"pass\"],[\"http://www.anketum.com\",\"http://www.anketum.com\",null,\"amirjanyanani@gmail.com\",\"60f441db4a\",\"r_email\",\"r_password2\"],[\"http://www.anketum.com\",\"http://www.anketum.com\",null,\"anime\",\"9ae66dd16b\",\"a_login\",\"a_password\"],[\"http://www.seosprint.net\",\"http://www.seosprint.net\",null,\"amirjanyanani@gmail.com\",\"ROzbB5ROg6\",\"askemail\",\"askpass\"],[\"http://www.wellpaid-bux.com\",\"http://www.wellpaid-bux.com\",null,\"Anime\",\"gaxtniq\",\"user\",\"password\"],[\"http://www.tviptc.com\",\"http://www.tviptc.com\",null,\"Anime\",\"gaxtniq\",\"user\",\"password\"],[\"http://hits4pay.com\",\"http://hits4pay.com\",null,\"Aninem\",\"chemasi\",\"USERNAME\",\"PASSWORD\"],[\"http://www.getbuxtoday.com\",\"http://www.getbuxtoday.com\",null,\"Anime\",\"gaxtniq\",\"18b7dbf7f499dddddc344c9d94a0ce2c6\",\"1ef7e9ecf51dc0ef6509cebfcae0cfc21\"],[\"http://minuteworkers.com\",\"http://minuteworkers.com\",null,\"Anime\",\"chemasi\",\"usr_email\",\"pwd\"],[\"http://www.newweblab.com\",\"http://www.newweblab.com\",null,\"amirjanyanani@gmail.com\",\"gaxtniq4i\",\"email\",\"password\"],[\"http://zepana.com\",\"http://zepana.com\",null,\"Anime\",\"gaxtniq\",\"login\",\"pass\"],[\"http://www.infinitybux.com\",\"http://www.infinitybux.com\",null,\"Anime\",\"gaxtniq\",\"user\",\"password\"],[\"http://kdv-sc.ru\",\"http://kdv-sc.ru\",null,\"amirjanyanani@gmail.com\",\"gaxtniq\",\"email2\",\"password\"],[\"https://my.webmoney.ru\",\"https://my.webmoney.ru\",null,\"amirjanyanani@gmail.com\",\"4emkaradshvara\",\"ctl00$cph$tbLogin\",\"ctl00$cph$tbPassword\"],[\"https://login.wmtransfer.com\",\"https://login.wmtransfer.com\",null,\"239177078530\",\"4emkaradshvara\",\"ctl00$Content$ctlGateKeeper$ctlLogin$ctlKM$txtLogin\",\"ctl00$Content$ctlGateKeeper$ctlLogin$ctlKM$txtPassword\"],[\"http://personal-bux.ru\",\"http://personal-bux.ru\",null,\"ani\",\"gaxtniq\",\"username\",\"password\"],[\"http://www.seosprint.net\",\"http://www.seosprint.net\",null,\"\\tR19551518725\",\"wxrwt\",\"ask_webmoney\",\"epcode\"],[\"http://igrun.com\",\"http://igrun.com\",null,\"amirjanyanani@gmail.com\",\"gaxtniq\",\"email\",\"psw1\"],[\"http://member.vezun27.com\",\"http://member.vezun27.com\",null,\"anime\",\"FY84JAZT\",\"username\",\"password\"],[\"http://vns-sc.ru\",\"http://vns-sc.ru\",null,\"amirjanyanani@gmail.com\",\"gaxtniq\",\"email\",\"password\"],[\"http://www.teabux.com\",\"http://www.teabux.com\",null,\"anime\",\"\u0433\u0430\u044C\u0442\u043D\u0438\u044F\",\"username\",\"password\"],[\"http://vns-sc.ru\",\"http://vns-sc.ru\",null,\"blackadder\",\"gaxtniq\",\"login\",\"password\"],[\"http://wm-forrest.ru\",\"http://wm-forrest.ru\",null,\"anime\",\"urish\",\"theusername\",\"thepassword\"],[\"http://www.seosprint.net\",\"http://www.seosprint.net\",null,\"R195515187257\",\"uwqus\",\"ask_webmoney\",\"epcode\"],[\"http://member.vezun27.com\",\"http://member.vezun27.com\",null,\"amirjanyanani@gmail.com\",\"FY84JAZT\",\"j_username\",\"j_password\"],[\"https://www.google.com\",\"https://www.google.com\",null,\"amirjanyan\",\"1368161836\",\"Email\",\"Passwd\"],[\"https://www.google.com\",\"https://www.google.com\",null,\"amirjanyanani\",\"chaprjak\",\"Email\",\"Passwd\"],[\"https://www.google.com\",\"https://www.google.com\",null,\"h.amirjanyan\",\"verysecretcode4me\",\"Email\",\"Passwd\"],[\"https://www.google.com\",\"https://www.google.com\",null,\"chromenta\",\"pass2word\",\"Email\",\"Passwd\"],[\"http://bux-matrix.com\",\"http://bux-matrix.com\",null,\"anime\",\"\u0433\u0430\u044C\u0442\u043D\u0438\u044F\",\"username\",\"password\"],[\"https://bux-matrix.com\",\"https://bux-matrix.com\",null,\"anime\",\"\u0433\u0430\u044C\u0442\u043D\u0438\u044F\",\"username\",\"password\"],[\"http://www.buxpedia.com\",\"http://www.buxpedia.com\",null,\"anime\",\"gaxtniq\",\"username\",\"password\"],[\"http://www.vip-prom.net\",\"http://www.vip-prom.net\",null,\"amirjanyanani@gmail.com\",\"CFzCxRB17s\",\"askemail\",\"askpass\"],[\"http://www.web-ip.ru\",\"http://www.web-ip.ru\",null,\"R195515187257\",\"gaxtniq\",\"wmr\",\"pass\"],[\"http://www.web-ip.ru\",\"http://www.web-ip.ru\",null,\"239177078530\",\"gaxtniq\",\"wmid\",\"pass\"],[\"http://www.eqbux.com\",\"http://www.eqbux.com\",null,\"Anime\",\"gaxtniq\",\"user\",\"password\"]]"

x=JSON.parse(str)

x.forEach(function(x){
	o=new nsLoginInfo2 
	o.init.apply(o,x)
	try{
		loginManager.addLogin(o)
	}catch(e){}
})




logins = loginManager.findLogins({}, hostname, formSubmitURL, httprealm);

logins.map(function(x)x.password+' : '+x.username)

loginManager.getLoginSavingEnabled(hostname)
