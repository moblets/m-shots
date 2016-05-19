#! /usr/bin/env node
var Nightmare = require('nightmare');
var CryptoJS = require('crypto-js');
var Awesome = require("awesome-logs");
var cli = require('cli');

var appId;
var configs = {
    server: "http://m.app.vc/",
    key: "deusehtop",
    output: "screenshots/",
    user_agent: {
      android: "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.76 Mobile Safari/537.36",
      ios: "Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_2_1 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8C148 Safari/6533.18.5"
    },
    viewport: {
        'ios-35': {
          width: 640,
          height: 920,
          zoomFactor: 120.0 / 72.0,
          label: '35'
        },
        'ios-4': {
          width: 640,
          height: 1096,
          zoomFactor: 120.0 / 72.0,
          label: '4'
        },
        'ios-47': {
          width: 750,
          height: 1334,
          zoomFactor: 150.0 / 72.0,
          label: '47'
        },
        'ios-55': {
          width: 1242,
          height: 2208,
          zoomFactor: 150.0 / 72.0,
          label: '55'
        },
        'android': {
          width: 750,
          height: 1334,
          zoomFactor: 150.0 / 72.0,
          label: 'android'
        }
    },
    wait: 5000
};

var getPageDefinitions = function(callback) {
    var url = configs.server + 'id/' + appId;
    Awesome.success('loading app data from url: ' + url);
    var lsKey = url + ":pages-definitions";
    Nightmare({
        show: false
    })
    .goto(url) // jshint ignore:line
    .wait(configs.wait)
    .evaluate(function(lsKey) {
        return window.localStorage[lsKey];
    }, lsKey)
    .end()
    .then(function(data) {
        var bytes = CryptoJS.AES.decrypt(data, configs.key);
        var json = bytes.toString(CryptoJS.enc.Utf8);
        Awesome.success('finish loading app data');
        Awesome.row();
        callback(JSON.parse(json));
    });
};

var routine = function(pages, viewport, useragent, show, callback) {
    Awesome.alert('taking ' + viewport + ' screenshots...');
    var url = configs.server + '/id/' + appId;
    var label = configs.viewport[viewport].label;
    var page1 = pages[0].pages[0].id,
		page2 = pages[0].pages[1] !== undefined ? pages[0].pages[1].id : false,
        page3 = pages[0].pages[2] !== undefined ? pages[0].pages[2].id : false;

    // attention: for mac book with retina screens, divide zoomFactor, width and height by 2
    var night = Nightmare({
        show: show,
        frame: false,
        webPreferences: {zoomFactor: configs.viewport[viewport].zoomFactor},
        width: configs.viewport[viewport].width,
        height: configs.viewport[viewport].height
    });

    night.useragent(configs.user_agent[useragent])
    .goto(url) // jshint ignore:line
    .wait('#close button')
    .click('#close button')
    .wait(configs.wait)
    .screenshot(process.cwd() + configs.output + label + '-page0-home.png');

    night.evaluate(function(page) {
        window.location.hash = "#/moblet/" + page + "/";
    }, page1)
    .wait(configs.wait)
    .screenshot(process.cwd() + configs.output + label + '-page1-' + page1 + '.png');

	if (page2) {
	    night.evaluate(function(page) {
	        window.location.hash = "#/moblet/" + page + "/";
	    }, page2)
	    .wait(configs.wait)
	    .screenshot(process.cwd() + configs.output + label + '-page2-' + page2 + '.png');
	}
	
	if (page3) {
    night.evaluate(function(page) {
        window.location.hash = "#/moblet/" + page + "/";
    }, page3)
    .wait(configs.wait)
    .screenshot(process.cwd() + configs.output + label + '-page3-' + page3 + '.png');
	}

  night.end()
  .then(function() {
    callback();
  });
  
};

cli.main(function(args, options) {
  
  var appId = args[0];

  if (typeof appId === "undefined") {
    Awesome.fail("app id not passed; aborting script");
    process.exit();
  } else {
    Awesome.row();
    Awesome.success("Starting screenshots process for app " + appId);
    Awesome.row();
  }
  
  getPageDefinitions(function(pages) {
      routine(pages, 'ios-35', 'ios', false, function() {
          routine(pages, 'ios-4', 'ios', false, function() {
              routine(pages, 'ios-47', 'ios', false, function() {
                  routine(pages, 'ios-55', 'ios', false, function() {
                      Awesome.row();
                      Awesome.success('screenshot process finished successfully!');
                      Awesome.row();
                  });
              });
          });
      });
  });
});
