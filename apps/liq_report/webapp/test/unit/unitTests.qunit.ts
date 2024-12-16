/* global QUnit */
// https://api.qunitjs.com/config/autostart/
QUnit.config.autostart = false;

// import all your QUnit tests here
void Promise.all([
	import("liqreport/test/unit/controller/MainPage.controller")
]).then(() => {
	QUnit.start();
});