'use strict';

/* eslint-disable no-unused-vars */
var platforms = [];
var variants = [];
var lookup = {};
var i = 0;
var variant = getQueryByName('variant');
var jvmVariant = getQueryByName('jvmVariant');
var variantSelector = document.getElementById('variant-selector');
var platformSelector = document.getElementById('platform-selector');

if (jvmVariant === undefined || jvmVariant === null) {
  jvmVariant = 'hotspot';
}

function setLookup() {
  // FUNCTIONS FOR GETTING PLATFORM DATA
  // allows us to use, for example, 'lookup["MAC"];'
  for (i = 0; i < platforms.length; i++) {
    lookup[platforms[i].searchableName] = platforms[i];
  }
}

function getVariantObject(variant) {
  var variantObject = '';
  variants.forEach(function (eachVariant) {
    if (eachVariant.searchableName === variant) {
      variantObject = eachVariant;
    }
  });
  return variantObject;
}

// gets the 'searchableName' when you pass in the full filename.
// If the filename does not match a known platform, returns false. (E.g. if a new or incorrect file appears in a repo)
function getSearchableName(filename) {
  var platform = null;
  platforms.forEach(function (eachPlatform) {
    if (filename.indexOf(eachPlatform.searchableName) >= 0) {
      platform = eachPlatform.searchableName;
    }
  });
  if (platform) {
    return platform;
  } else {
    return null;
  }
}

// set path to logos
var logoPath = './dist/assets/';

// gets the OFFICIAL NAME when you pass in 'searchableName'
function getOfficialName(searchableName) {
  return lookup[searchableName].officialName;
}

function getPlatformOrder(searchableName) {
  var index = platforms.findIndex(function (platform) {
    return platform.searchableName == searchableName;
  });
  return index;
}

function orderPlatforms(inputArray) {
  function compareOrder(thisAsset, nextAsset) {
    if (thisAsset.thisPlatformOrder < nextAsset.thisPlatformOrder) return -1;
    if (thisAsset.thisPlatformOrder > nextAsset.thisPlatformOrder) return 1;
    return 0;
  }
  var orderedArray = inputArray.sort(compareOrder);
  return orderedArray;
}

// gets the BINARY EXTENSION when you pass in 'searchableName'
function getBinaryExt(searchableName) {
  return lookup[searchableName].binaryExtension;
}

// gets the INSTALLER EXTENSION when you pass in 'searchableName'
function getInstallerExt(searchableName) {
  return lookup[searchableName].installerExtension;
}

// gets the LOGO WITH PATH when you pass in 'searchableName'
function getLogo(searchableName) {
  return logoPath + lookup[searchableName].logo;
}

// gets the INSTALLATION COMMAND when you pass in 'searchableName'
function getInstallCommand(searchableName) {
  return lookup[searchableName].installCommand;
}

// gets the CHECKSUM COMMAND when you pass in 'searchableName'
function getChecksumCommand(searchableName) {
  return lookup[searchableName].checksumCommand;
}

// gets the PATH COMMAND when you pass in 'searchableName'
function getPathCommand(searchableName) {
  return lookup[searchableName].pathCommand;
}

// set value for loading dots on every page
var loading = document.getElementById('loading');

// set value for error container on every page
var errorContainer = document.getElementById('error-container');

// set variable names for menu elements
var menuOpen = document.getElementById('menu-button');
var menuClose = document.getElementById('menu-close');
var menu = document.getElementById('menu-container');

menuOpen.onclick = function () {
  menu.className = menu.className.replace(/(?:^|\s)slideOutLeft(?!\S)/g, ' slideInLeft'); // slide in animation
  menu.className = menu.className.replace(/(?:^|\s)hide(?!\S)/g, ' animated'); // removes initial hidden property, activates animations
};

menuClose.onclick = function () {
  menu.className = menu.className.replace(/(?:^|\s)slideInLeft(?!\S)/g, ' slideOutLeft'); // slide out animation
};

// this function returns an object containing all information about the user's OS (from the 'platforms' array)
function detectOS() {
  // if the platform detection library's output matches the 'osDetectionString' of any platform object in the 'platforms' array...
  // ...set the variable 'matchedOS' as the whole object. Else, 'matchedOS' will be null.
  var matchedOS = null;
  platforms.forEach(function (eachPlatform) {
    var thisPlatformMatchingString = eachPlatform.osDetectionString.toUpperCase();
    /* eslint-disable */
    var platformFamily = platform.os.family.toUpperCase(); // platform.os.family is dependent on 'platform.js', loaded by index.html (injected in index.handlebars)
    /* eslint-enable */
    if (thisPlatformMatchingString.indexOf(platformFamily) >= 0) {
      // if the detected 'platform family' string appears in the osDetectionString value of a platform...
      matchedOS = eachPlatform;
    }
  });

  if (matchedOS) {
    return matchedOS;
  } else {
    return null;
  }
}

function toJson(response) {
  while (typeof response === 'string') {
    try {
      response = JSON.parse(response);
    } catch (e) {
      return null;
    }
  }
  return response;
}

// load latest_nightly.json/nightly.json/releases.json/latest_release.json files
// This will first try to load from openjdk<X>-binaries repos and if that fails
// try openjdk<X>-release, i.e will try the following:

// https://github.com/AdoptOpenJDK/openjdk10-binaries/blob/master/latest_release.json
// https://github.com/AdoptOpenJDK/openjdk10-releases/blob/master/latest_release.json
/* eslint-disable no-unused-vars */
function loadAssetInfo(variant, openjdkImp, releaseType, release, handleResponse, errorHandler) {
  if (variant === 'amber') {
    variant = 'openjdk-amber';
  }

  var url = 'https://api.adoptopenjdk.net/v2/info/' + releaseType + '/' + variant + '?';

  if (release !== undefined) {
    url += 'release=' + release + '&';
  }
  if (openjdkImp !== undefined) {
    url += 'openjdk_impl=' + openjdkImp + '&';
  }

  loadUrl(url, function (response) {
    if (response === null) {
      errorHandler();
    } else {
      response = toJson(response);
      handleResponse(response, false);
    }
  });
}

// when using this function, pass in the name of the repo (options: releases, nightly)
function loadJSON(repo, filename, callback) {
  var url = 'https://raw.githubusercontent.com/AdoptOpenJDK/' + repo + '/master/' + filename + '.json'; // the URL of the JSON built in the website back-end
  if (repo === 'adoptopenjdk.net') {
    url = filename;
  }
  loadUrl(url, callback);
}

function loadUrl(url, callback) {
  var xobj = new XMLHttpRequest();
  xobj.open('GET', url, true);
  xobj.onreadystatechange = function () {
    if (xobj.readyState == 4 && xobj.status == '200') {
      // if the status is 'ok', run the callback function that has been passed in.
      callback(xobj.responseText);
    } else if (xobj.status != '200' && // if the status is NOT 'ok', remove the loading dots, and display an error:
    xobj.status != '0') {
      // for IE a cross domain request has status 0, we're going to execute this block fist, than the above as well.
      callback(null);
    }
  };
  xobj.send(null);
}

/* eslint-disable no-unused-vars */
function loadPlatformsThenData(callback) {
  loadJSON('adoptopenjdk.net', './dist/json/config.json', function (response) {
    var configJson = JSON.parse(response);

    if (typeof configJson !== 'undefined') {
      // if there are releases...
      platforms = configJson.platforms;
      variants = configJson.variants;
      setVariantSelector();
      setLookup();
      callback();
    } else {
      // report an error
      errorContainer.innerHTML = '<p>Error... there\'s a problem fetching the releases. Please see the <a href=\'https://github.com/AdoptOpenJDK/openjdk-releases/releases\' target=\'blank\'>releases list on GitHub</a>.</p>';
      loading.innerHTML = ''; // remove the loading dots
    }
  });
}

// build the menu twisties
var submenus = document.getElementById('menu-content').getElementsByClassName('submenu');

for (i = 0; i < submenus.length; i++) {
  var twisty = document.createElement('span');
  var twistyContent = document.createTextNode('>');
  twisty.appendChild(twistyContent);
  twisty.className = 'twisty';

  var thisLine = submenus[i].getElementsByTagName('a')[0];
  thisLine.appendChild(twisty);

  thisLine.onclick = function () {
    this.parentNode.classList.toggle('open');
  };
}

/* eslint-disable no-unused-vars */
function setTickLink() {
  var ticks = document.getElementsByClassName('tick');
  for (i = 0; i < ticks.length; i++) {
    ticks[i].addEventListener('click', function (event) {
      var win = window.open('https://en.wikipedia.org/wiki/Technology_Compatibility_Kit', '_blank');
      if (win) {
        win.focus();
      } else {
        alert('New tab blocked - please allow popups.');
      }
      event.preventDefault();
    });
  }
}

// builds up a query, i.e "...nightly.html?variant=openjdk8&jvmVariant=hotspot"
function formUrlQueryArgs(args) {
  var first = true;
  var search = '';

  for (var i = 0; i < args.length; i = i + 2) {
    var name = args[i];
    var newValue = args[i + 1];

    if (!first) {
      search += '&' + name + '=' + newValue;
    } else {
      search += name + '=' + newValue;
      first = false;
    }
  }
  return search;
}

/* eslint-disable no-unused-vars */
function getRepoName(oldRepo, releaseType) {
  var jvmVariantTag = '';

  if (oldRepo) {
    if (jvmVariant !== 'hotspot') {
      jvmVariantTag = '-' + jvmVariant;
    }

    return variant + jvmVariantTag + '-' + releaseType;
  } else {
    return variant + '-' + jvmVariant;
  }
}

/* eslint-disable no-unused-vars */
function formSearchArgs() {
  return formUrlQueryArgs(arguments);
}

function setUrlQuery() {
  window.location.search = formUrlQueryArgs(arguments);
}

function getQueryByName(name) {
  var url = window.location.href;
  name = name.replace(/[[]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
  var results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/* eslint-disable no-unused-vars */
function persistUrlQuery() {
  var anchor = '';
  var links = Array.apply(null, document.getElementsByTagName('a'));
  var link = window.location.hostname;
  if (link != 'localhost') {
    link = 'https://' + link;
  }
  links.forEach(function (eachLink) {
    if (eachLink.href.indexOf(link) >= 0) {
      if (eachLink.href.indexOf('#') > -1) {
        anchor = '#' + eachLink.href.split('#').pop();
        eachLink.href = eachLink.href.substr(0, eachLink.href.indexOf('#'));
        if (eachLink.href.indexOf('?') > -1) {
          eachLink.href = eachLink.href.substr(0, eachLink.href.indexOf('?'));
        }
        eachLink.href = eachLink.href + window.location.search + anchor;
      } else {
        eachLink.href = eachLink.href + window.location.search;
      }
    }
  });
}

var versionMatcher = /(openjdk\d+|amber)-([a-zA-Z0-9]+)/;

function setVariantSelector() {
  if (variantSelector) {
    if (variantSelector.options.length === 0) {
      variants.forEach(function (eachVariant) {
        var op = new Option();
        op.value = eachVariant.searchableName;
        op.text = eachVariant.officialName;
        op.description = eachVariant.description;
        op.descriptionLink = eachVariant.descriptionLink;
        variantSelector.options.add(op);
        if (!variant && eachVariant.default) {
          var matches = variantSelector.value.match(versionMatcher);
          variant = matches[1];
          jvmVariant = matches[2];
        }
      });
    }

    if (!variant) {
      variant = variants[0].searchableName;
    }

    variantSelector.value = variant + '-' + jvmVariant;

    if (variantSelector.value === '') {
      var op = new Option();
      op.value = 'unknown';
      op.text = 'Select a variant';
      variantSelector.options.add(op);
      variantSelector.value = 'unknown';
      errorContainer.innerHTML = '<p>Error: no such variant. Please select a valid variant from the drop-down list.</p>';
    }

    variantSelector.onchange = function () {
      var matches = variantSelector.value.match(versionMatcher);
      var versionNumber = matches[1];
      var jvmVariant = matches[2];
      setUrlQuery('variant', versionNumber, 'jvmVariant', jvmVariant);
    };
  }
}

/* eslint-disable no-unused-vars */
function copyClipboard(element) {
  var $temp = $('<input>');
  $('body').append($temp);
  $temp.val($(element).text()).select();
  document.execCommand('copy');
  $temp.remove();
  alert('Copied to clipboard');
}

/* eslint-disable no-unused-vars */
function highlightCode() {
  hljs.initHighlightingOnLoad();
}
'use strict';

var ARCHIVEDATA;

// When releases page loads, run:
/* eslint-disable no-unused-vars */
function onArchiveLoad() {
  /* eslint-enable no-unused-vars */
  ARCHIVEDATA = new Object();
  populateArchive(); // populate the Archive page
}

// ARCHIVE PAGE FUNCTIONS

/* eslint-disable no-undef */
function populateArchive() {
  loadPlatformsThenData(function () {

    var handleResponse = function handleResponse(response) {
      loadJSON(getRepoName(true, 'releases'), 'jck', function (response_jck) {
        var jckJSON = {};
        if (response_jck !== null) {
          jckJSON = JSON.parse(response_jck);
        }
        buildArchiveHTML(response, jckJSON);
      });
      return true;
    };

    loadAssetInfo(variant, jvmVariant, 'releases', undefined, handleResponse, function () {
      // if there are no releases (beyond the latest one)...
      // report an error, remove the loading dots
      loading.innerHTML = '';
      errorContainer.innerHTML = '<p>There are no archived releases yet for ' + variant + ' on the ' + jvmVariant + ' jvm. See the <a href=\'./releases.html?variant=' + variant + '&jvmVariant=' + jvmVariant + '\'>Latest release</a> page.</p>';
    });
  });
}

function buildArchiveHTML(releases, jckJSON) {
  var RELEASEARRAY = [];

  for (i = 0; i < releases.length; i++) {
    var ASSETARRAY = [];
    var RELEASEOBJECT = new Object();
    var eachRelease = releases[i];

    // set values for this release, ready to inject into HTML
    var publishedAt = eachRelease.timestamp;
    RELEASEOBJECT.thisReleaseName = eachRelease.release_name;
    RELEASEOBJECT.thisReleaseDay = moment(publishedAt).format('D');
    RELEASEOBJECT.thisReleaseMonth = moment(publishedAt).format('MMMM');
    RELEASEOBJECT.thisReleaseYear = moment(publishedAt).format('YYYY');
    RELEASEOBJECT.thisGitLink = 'https://github.com/AdoptOpenJDK/' + getRepoName(true, 'releases') + '/releases/tag/' + RELEASEOBJECT.thisReleaseName;

    // create an array of the details for each asset that is attached to this release
    var assetArray = eachRelease.binaries;

    // populate 'platformTableRows' with one row per binary for this release...
    assetArray.forEach(function (eachAsset) {
      var ASSETOBJECT = new Object();
      var nameOfFile = eachAsset.binary_name;
      var uppercaseFilename = nameOfFile.toUpperCase(); // make the name of the asset uppercase

      ASSETOBJECT.thisPlatform = getSearchableName(uppercaseFilename); // get the searchableName, e.g. MAC or X64_LINUX.

      // firstly, check if the platform name is recognised...
      if (ASSETOBJECT.thisPlatform) {

        // if the filename contains both the platform name and the matching INSTALLER extension, add the relevant info to the asset object
        ASSETOBJECT.thisInstallerExtension = getInstallerExt(ASSETOBJECT.thisPlatform);

        ASSETOBJECT.thisBinaryExtension = getBinaryExt(ASSETOBJECT.thisPlatform); // get the file extension associated with this platform

        if (uppercaseFilename.indexOf(ASSETOBJECT.thisInstallerExtension.toUpperCase()) >= 0) {
          if (ASSETARRAY.length > 0) {
            ASSETARRAY.forEach(function (asset) {
              if (asset.thisPlatform === ASSETOBJECT.thisPlatform) {
                ASSETARRAY.pop();
              }
            });
          }
          ASSETOBJECT.thisPlatformExists = true;
          ASSETOBJECT.thisInstallerExists = true;
          RELEASEOBJECT.installersExist = true;
          ASSETOBJECT.thisInstallerLink = eachAsset.binary_link;
          ASSETOBJECT.thisInstallerSize = Math.floor(eachAsset.binary_size / 1024 / 1024);
          ASSETOBJECT.thisOfficialName = getOfficialName(ASSETOBJECT.thisPlatform);
          ASSETOBJECT.thisBinaryExists = true;
          RELEASEOBJECT.binariesExist = true;
          ASSETOBJECT.thisBinaryLink = eachAsset.binary_link.replace(ASSETOBJECT.thisInstallerExtension, ASSETOBJECT.thisBinaryExtension);
          ASSETOBJECT.thisBinarySize = Math.floor(eachAsset.binary_size / 1024 / 1024);
          ASSETOBJECT.thisChecksumLink = eachAsset.checksum_link;

          ASSETOBJECT.thisPlatformOrder = getPlatformOrder(ASSETOBJECT.thisPlatform);
          if (Object.keys(jckJSON).length == 0) {
            ASSETOBJECT.thisVerified = false;
          } else {
            if (jckJSON[eachRelease.release_name] && jckJSON[eachRelease.release_name].hasOwnProperty(ASSETOBJECT.thisPlatform)) {
              ASSETOBJECT.thisVerified = true;
            } else {
              ASSETOBJECT.thisVerified = false;
            }
            ASSETOBJECT.thisPlatformOrder = getPlatformOrder(ASSETOBJECT.thisPlatform);
          }
        }

        // secondly, check if the file has the expected file extension for that platform...
        // (this filters out all non-binary attachments, e.g. SHA checksums - these contain the platform name, but are not binaries)

        if (uppercaseFilename.indexOf(ASSETOBJECT.thisBinaryExtension.toUpperCase()) >= 0) {
          var installerExist = false;
          if (ASSETARRAY.length > 0) {
            ASSETARRAY.forEach(function (asset) {
              if (asset.thisPlatform === ASSETOBJECT.thisPlatform) {
                installerExist = true;
              }
            });
          }
          if (!installerExist) {
            // set values ready to be injected into the HTML
            ASSETOBJECT.thisPlatformExists = true;
            ASSETOBJECT.thisBinaryExists = true;
            RELEASEOBJECT.binariesExist = true;
            ASSETOBJECT.thisOfficialName = getOfficialName(ASSETOBJECT.thisPlatform);
            ASSETOBJECT.thisBinaryLink = eachAsset.binary_link;
            ASSETOBJECT.thisBinarySize = Math.floor(eachAsset.binary_size / 1024 / 1024);
            ASSETOBJECT.thisChecksumLink = eachAsset.checksum_link;
            ASSETOBJECT.thisPlatformOrder = getPlatformOrder(ASSETOBJECT.thisPlatform);
            if (Object.keys(jckJSON).length == 0) {
              ASSETOBJECT.thisVerified = false;
            } else {
              if (jckJSON[eachRelease.release_name] && jckJSON[eachRelease.release_name].hasOwnProperty(ASSETOBJECT.thisPlatform)) {
                ASSETOBJECT.thisVerified = true;
              } else {
                ASSETOBJECT.thisVerified = false;
              }
            }
          }
        }

        if (ASSETOBJECT.thisPlatformExists === true) {
          ASSETARRAY.push(ASSETOBJECT);
        }
      }
    });

    ASSETARRAY = orderPlatforms(ASSETARRAY);

    RELEASEOBJECT.thisPlatformAssets = ASSETARRAY;
    RELEASEARRAY.push(RELEASEOBJECT);
  }

  ARCHIVEDATA.htmlTemplate = RELEASEARRAY;
  var template = Handlebars.compile(document.getElementById('template').innerHTML);
  document.getElementById('archive-table-body').innerHTML = template(ARCHIVEDATA);

  setPagination();
  setTickLink();

  loading.innerHTML = ''; // remove the loading dots

  // show the archive list and filter box, with fade-in animation
  var archiveList = document.getElementById('archive-list');
  archiveList.className = archiveList.className.replace(/(?:^|\s)hide(?!\S)/g, ' animated fadeIn ');
}

function setPagination() {
  var container = $('#pagination-container');
  var archiveRows = document.getElementById('archive-table-body').getElementsByClassName('release-row');
  var paginationArrayHTML = [];
  for (i = 0; i < archiveRows.length; i++) {
    paginationArrayHTML.push(archiveRows[i].outerHTML);
  }

  var options = {
    dataSource: paginationArrayHTML,
    pageSize: 5,
    callback: function callback(response) {

      var dataHtml = '';

      $.each(response, function (index, item) {
        dataHtml += item;
      });

      $('#archive-table-body').html(dataHtml);
    }
  };

  container.pagination(options);

  if (document.getElementById('pagination-container').getElementsByTagName('li').length <= 3) {
    document.getElementById('pagination-container').classList.add('hide');
  }

  return container;
}
'use strict';

// set variables for all index page HTML elements that will be used by the JS
var dlText = document.getElementById('dl-text');
var dlLatest = document.getElementById('dl-latest');
var dlArchive = document.getElementById('dl-archive');
var dlOther = document.getElementById('dl-other');
var dlIcon = document.getElementById('dl-icon');
var dlIcon2 = document.getElementById('dl-icon-2');
var dlVersionText = document.getElementById('dl-version-text');

// When index page loads, run:
/* eslint-disable no-unused-vars */
function onIndexLoad() {
  setDownloadSection(); // on page load, populate the central download section.
}
/* eslint-enable no-unused-vars */

// INDEX PAGE FUNCTIONS

/* eslint-disable no-unused-vars */
function setDownloadSection() {
  loadPlatformsThenData(function () {
    var handleResponse = function handleResponse(releasesJson) {
      if (releasesJson !== null && releasesJson !== 'undefined') {

        /* eslint-disable no-undef */
        var repoName = getRepoName(true, 'releases');

        if (typeof releasesJson !== 'undefined') {
          // if there are releases...
          loadJSON(repoName, 'jck', function (response_jck) {
            var jckJSON = {};
            if (response_jck !== null) {
              jckJSON = JSON.parse(response_jck);
            }
            buildHomepageHTML(releasesJson, jckJSON);
          });
          return true;
        }
      }
      return false;
    };

    /* eslint-disable no-undef */
    loadAssetInfo(variant, jvmVariant, 'releases', 'latest', handleResponse, function () {
      errorContainer.innerHTML = '<p>There are no releases available for ' + variant + ' on the ' + jvmVariant + ' jvm. Please check our <a href=nightly.html?variant=' + variant + '&jvmVariant=' + jvmVariant + ' target=\'blank\'>Nightly Builds</a>.</p>';
      loading.innerHTML = ''; // remove the loading dots
    });
  });
}

/* eslint-disable no-unused-vars */
function buildHomepageHTML(releasesJson, jckJSON) {
  // set the download button's version number to the latest release
  dlVersionText.innerHTML = releasesJson.release_name;

  var assetArray = releasesJson.binaries;

  var OS = detectOS(); // set a variable as an object containing all information about the user's OS (from the global.js 'platforms' array)
  var matchingFile = null;

  // if the OS has been detected...
  if (OS) {
    assetArray.forEach(function (eachAsset) {
      // iterate through the assets attached to this release
      var nameOfFile = eachAsset.binary_name;
      var uppercaseFilename = nameOfFile.toUpperCase();
      var thisPlatform = getSearchableName(uppercaseFilename); // get the searchableName, e.g. X64_MAC or X64_LINUX.
      var uppercaseOSname = null;
      // firstly, check if a valid searchableName has been returned (i.e. the platform is recognised)...
      if (thisPlatform) {

        // secondly, check if the file has the expected file extension for that platform...
        // (this filters out all non-binary attachments, e.g. SHA checksums - these contain the platform name, but are not binaries)
        var thisBinaryExtension = getBinaryExt(thisPlatform); // get the binary extension associated with this platform
        var thisInstallerExtension = getInstallerExt(thisPlatform); // get the installer extension associated with this platform
        if (matchingFile == null) {
          if (uppercaseFilename.indexOf(thisInstallerExtension.toUpperCase()) >= 0) {
            uppercaseOSname = OS.searchableName.toUpperCase();
            if (Object.keys(jckJSON).length != 0) {
              if (jckJSON[releasesJson.tag_name] && jckJSON[releasesJson.tag_name].hasOwnProperty(uppercaseOSname)) {
                document.getElementById('jck-approved-tick').classList.remove('hide');
                setTickLink();
              }
            }

            // thirdly, check if the user's OS searchableName string matches part of this binary's name (e.g. ...X64_LINUX...)
            if (uppercaseFilename.indexOf(uppercaseOSname) >= 0) {
              matchingFile = eachAsset; // set the matchingFile variable to the object containing this binary
            }
          } else if (uppercaseFilename.indexOf(thisBinaryExtension.toUpperCase()) >= 0) {
            uppercaseOSname = OS.searchableName.toUpperCase();
            if (Object.keys(jckJSON).length != 0) {
              if (jckJSON[releasesJson.tag_name] && jckJSON[releasesJson.tag_name].hasOwnProperty(uppercaseOSname)) {
                document.getElementById('jck-approved-tick').classList.remove('hide');
                setTickLink();
              }
            }
            // thirdly, check if the user's OS searchableName string matches part of this binary's name (e.g. ...X64_LINUX...)
            if (uppercaseFilename.indexOf(uppercaseOSname) >= 0) {
              matchingFile = eachAsset; // set the matchingFile variable to the object containing this binary
            }
          }
        }
      }
    });
  }

  // if there IS a matching binary for the user's OS...
  if (matchingFile) {
    dlLatest.href = matchingFile.binary_link; // set the main download button's link to be the binary's download url
    dlText.innerHTML = 'Download for <var platform-name>' + OS.officialName + '</var>'; // set the text to be OS-specific, using the full OS name.
    var thisBinarySize = Math.floor(matchingFile.binary_size / 1024 / 1024);
    dlVersionText.innerHTML += ' - ' + thisBinarySize + ' MB';
  }
  // if there is NOT a matching binary for the user's OS...
  else {
      dlOther.classList.add('hide'); // hide the 'Other platforms' button
      dlIcon.classList.add('hide'); // hide the download icon on the main button, to make it look less like you're going to get a download immediately
      dlIcon2.classList.remove('hide'); // un-hide an arrow-right icon to show instead
      dlText.innerHTML = 'Downloads'; // change the text to be generic: 'Downloads'.
      /* eslint-disable no-undef */
      dlLatest.href = './releases.html?' + formSearchArgs('variant', variant, 'jvmVariant', jvmVariant); // set the main download button's link to the latest releases page for all platforms.
    }

  // remove the loading dots, and make all buttons visible, with animated fade-in
  loading.classList.add('hide');
  dlLatest.className = dlLatest.className.replace(/(?:^|\s)invisible(?!\S)/g, ' animated ');
  dlOther.className = dlOther.className.replace(/(?:^|\s)invisible(?!\S)/g, ' animated ');
  dlArchive.className = dlArchive.className.replace(/(?:^|\s)invisible(?!\S)/g, ' animated ');

  dlLatest.onclick = function () {
    document.getElementById('installation-link').className += ' animated pulse infinite transition-bright';
  };

  // animate the main download button shortly after the initial animation has finished.
  setTimeout(function () {
    dlLatest.className = 'dl-button a-button animated pulse';
  }, 1000);
}
'use strict';

var INSTALLDATA;

/* eslint-disable no-unused-vars */
function onInstallationLoad() {
  /* eslint-enable no-unused-vars */

  INSTALLDATA = new Object();
  populateInstallation(); // populate the Latest page
}

/* eslint-disable no-unused-vars */
function populateInstallation() {
  loadPlatformsThenData(function () {

    var handleResponse = function handleResponse(response) {
      buildInstallationHTML(response);
      return true;
    };

    /* eslint-disable no-undef */
    loadAssetInfo(variant, jvmVariant, 'releases', 'latest', handleResponse, function () {
      errorContainer.innerHTML = '<p>Error... no installation information has been found!</p>';
      loading.innerHTML = ''; // remove the loading dots
    });
  });
}

function buildInstallationHTML(releasesJson) {

  // create an array of the details for each asset that is attached to a release
  var assetArray = releasesJson.binaries;

  var ASSETARRAY = [];

  // for each asset attached to this release, check if it's a valid binary, then add a download block for it...
  assetArray.forEach(function (eachAsset) {
    var ASSETOBJECT = new Object();
    var nameOfFile = eachAsset.binary_name;
    var uppercaseFilename = nameOfFile.toUpperCase(); // make the name of the asset uppercase
    ASSETOBJECT.thisPlatform = getSearchableName(uppercaseFilename); // get the searchableName, e.g. MAC or X64_LINUX.

    // check if the platform name is recognised...
    if (ASSETOBJECT.thisPlatform) {

      ASSETOBJECT.thisPlatformOrder = getPlatformOrder(ASSETOBJECT.thisPlatform);
      ASSETOBJECT.thisOfficialName = getOfficialName(ASSETOBJECT.thisPlatform);

      // if the filename contains both the platform name and the matching BINARY extension, add the relevant info to the asset object
      ASSETOBJECT.thisBinaryExtension = getBinaryExt(ASSETOBJECT.thisPlatform);
      if (uppercaseFilename.indexOf(ASSETOBJECT.thisBinaryExtension.toUpperCase()) >= 0) {
        ASSETOBJECT.thisPlatformExists = true;
        ASSETOBJECT.thisBinaryLink = eachAsset.binary_link;
        ASSETOBJECT.thisBinaryFilename = eachAsset.binary_name;
        ASSETOBJECT.thisChecksumLink = eachAsset.checksum_link;
        ASSETOBJECT.thisChecksumFilename = eachAsset.binary_name.replace(ASSETOBJECT.thisBinaryExtension, '.sha256.txt');
        ASSETOBJECT.thisUnzipCommand = getInstallCommand(ASSETOBJECT.thisPlatform).replace('FILENAME', ASSETOBJECT.thisBinaryFilename);
        ASSETOBJECT.thisChecksumCommand = getChecksumCommand(ASSETOBJECT.thisPlatform).replace('FILENAME', ASSETOBJECT.thisBinaryFilename);
        ASSETOBJECT.thisPathCommand = getPathCommand(ASSETOBJECT.thisPlatform).replace('DIRNAME', releasesJson.release_name);
      }

      if (ASSETOBJECT.thisPlatformExists === true) {
        ASSETARRAY.push(ASSETOBJECT);
      }
    }
  });

  ASSETARRAY = orderPlatforms(ASSETARRAY);

  INSTALLDATA.htmlTemplate = ASSETARRAY;

  var template = Handlebars.compile(document.getElementById('template').innerHTML);
  document.getElementById('installation-template').innerHTML = template(INSTALLDATA);

  setInstallationPlatformSelector(ASSETARRAY);
  window.onhashchange = displayInstallPlatform;

  loading.innerHTML = ''; // remove the loading dots
  var installationContainer = document.getElementById('installation-container');
  installationContainer.className = installationContainer.className.replace(/(?:^|\s)hide(?!\S)/g, ' animated fadeIn ');
}

function displayInstallPlatform() {
  var platformHash = window.location.hash.substr(1).toUpperCase();
  var thisPlatformInstallation = document.getElementById('installation-container-' + platformHash);
  unselectInstallPlatform();

  if (thisPlatformInstallation) {
    platformSelector.value = platformHash;
    thisPlatformInstallation.classList.remove('hide');
  } else {
    var currentValues = [];
    var platformSelectorOptions = Array.apply(null, platformSelector.options);
    platformSelectorOptions.forEach(function (eachOption) {
      currentValues.push(eachOption.value);
    });
    if (currentValues.indexOf('unknown') === -1) {
      var op = new Option();
      op.value = 'unknown';
      op.text = 'Select a platform';
      platformSelector.options.add(op, 0);
    }
    platformSelector.value = 'unknown';
  }
}

function unselectInstallPlatform() {
  var platformInstallationDivs = document.getElementById('installation-container').getElementsByClassName('installation-single-platform');

  for (i = 0; i < platformInstallationDivs.length; i++) {
    platformInstallationDivs[i].classList.add('hide');
  }
}

function setInstallationPlatformSelector(thisReleasePlatforms) {

  if (platformSelector) {
    if (platformSelector.options.length === 0) {
      thisReleasePlatforms.forEach(function (eachPlatform) {
        var op = new Option();
        op.value = eachPlatform.thisPlatform;
        op.text = eachPlatform.thisOfficialName;
        platformSelector.options.add(op);
      });
    }

    var OS = detectOS();
    if (OS && window.location.hash.length < 1) {
      platformSelector.value = OS.searchableName;
      window.location.hash = platformSelector.value.toLowerCase();
      displayInstallPlatform();
    } else {
      displayInstallPlatform();
    }

    platformSelector.onchange = function () {
      window.location.hash = platformSelector.value.toLowerCase();
      displayInstallPlatform();
    };
  }
}
'use strict';

// set variables for HTML elements
var NIGHTLYDATA;

var tableHead = document.getElementById('table-head');
var tableContainer = document.getElementById('nightly-list');
var nightlyList = document.getElementById('nightly-table');
var searchError = document.getElementById('search-error');
var numberpicker = document.getElementById('numberpicker');
var datepicker = document.getElementById('datepicker');

// When nightly page loads, run:
/* eslint-disable no-unused-vars */
function onNightlyLoad() {
  /* eslint-enable no-unused-vars */
  NIGHTLYDATA = new Object();

  setDatePicker();
  populateNightly(); // run the function to populate the table on the Nightly page.

  numberpicker.onchange = function () {
    setTableRange();
  };
  datepicker.onchange = function () {
    setTableRange();
  };
}

// NIGHTLY PAGE FUNCTIONS

function setDatePicker() {
  $(datepicker).datepicker();
  var today = moment().format('MM/DD/YYYY');
  datepicker.value = today;
}

/* eslint-disable no-undef */
function populateNightly() {
  loadPlatformsThenData(function () {

    var handleResponse = function handleResponse(response) {

      // Step 1: create a JSON from the XmlHttpRequest response
      var releasesJson = response.reverse();

      // if there are releases...
      if (typeof releasesJson[0] !== 'undefined') {
        var files = getFiles(releasesJson);

        if (files.length === 0) {
          return false;
        }
        buildNightlyHTML(files);
      }

      return true;
    };

    loadAssetInfo(variant, jvmVariant, 'nightly', undefined, handleResponse, function () {
      errorContainer.innerHTML = '<p>Error... no releases have been found!</p>';
      loading.innerHTML = ''; // remove the loading dots
    });
  });
}

/* eslint-disable no-undef */
function getFiles(releasesJson) {
  var assets = [];

  // for each release...
  releasesJson.forEach(function (eachRelease) {

    // create an array of the details for each binary that is attached to a release
    var assetArray = eachRelease.binaries;

    assetArray.forEach(function (eachAsset) {
      var NIGHTLYOBJECT = new Object();
      var nameOfFile = eachAsset.binary_name;
      var uppercaseFilename = nameOfFile.toUpperCase(); // make the name of the file uppercase
      NIGHTLYOBJECT.thisPlatform = getSearchableName(uppercaseFilename); // get the searchableName, e.g. MAC or X64_LINUX.
      var isArchive = new RegExp('(.tar.gz|.zip)$').test(nameOfFile);

      var correctFile = isArchive;

      // firstly, check if the platform name is recognised...
      if (correctFile && NIGHTLYOBJECT.thisPlatform) {
        assets.push({
          release: eachRelease,
          asset: eachAsset
        });
      }
    });
  });

  return assets;
}

function buildNightlyHTML(files) {
  tableHead.innerHTML = '<tr id=\'table-header\'><th>Platform</th><th>Type</th></th><th>Date</th><th>Binary</th><th>Checksum</th></tr>';
  var NIGHTLYARRAY = [];

  // for each release...
  files.forEach(function (file) {
    // for each file attached to this release...

    var eachAsset = file.asset;
    var eachRelease = file.release;

    var NIGHTLYOBJECT = new Object();
    var nameOfFile = eachAsset.binary_name;
    var uppercaseFilename = nameOfFile.toUpperCase(); // make the name of the file uppercase
    NIGHTLYOBJECT.thisPlatform = getSearchableName(uppercaseFilename); // get the searchableName, e.g. MAC or X64_LINUX.
    var type = nameOfFile.includes('-jre') ? 'jre' : 'jdk';

    // secondly, check if the file has the expected file extension for that platform...
    // (this filters out all non-binary attachments, e.g. SHA checksums - these contain the platform name, but are not binaries)
    NIGHTLYOBJECT.thisBinaryExtension = getBinaryExt(NIGHTLYOBJECT.thisPlatform); // get the file extension associated with this platform
    if (uppercaseFilename.indexOf(NIGHTLYOBJECT.thisBinaryExtension.toUpperCase()) >= 0) {

      // set values ready to be injected into the HTML
      var publishedAt = eachRelease.timestamp;
      NIGHTLYOBJECT.thisReleaseName = eachRelease.release_name.slice(0, 12);
      NIGHTLYOBJECT.thisType = type;
      NIGHTLYOBJECT.thisReleaseDay = moment(publishedAt).format('D');
      NIGHTLYOBJECT.thisReleaseMonth = moment(publishedAt).format('MMMM');
      NIGHTLYOBJECT.thisReleaseYear = moment(publishedAt).format('YYYY');
      NIGHTLYOBJECT.thisGitLink = 'https://github.com/AdoptOpenJDK/' + getRepoName(true, 'nightly') + '/releases/tag/' + eachRelease.release_name;
      NIGHTLYOBJECT.thisOfficialName = getOfficialName(NIGHTLYOBJECT.thisPlatform);
      NIGHTLYOBJECT.thisBinaryLink = eachAsset.binary_link;
      NIGHTLYOBJECT.thisBinarySize = Math.floor(eachAsset.binary_size / 1024 / 1024);
      NIGHTLYOBJECT.thisChecksumLink = eachAsset.checksum_link;

      NIGHTLYARRAY.push(NIGHTLYOBJECT);
    }
  });

  NIGHTLYDATA.htmlTemplate = NIGHTLYARRAY;
  var template = Handlebars.compile(document.getElementById('template').innerHTML);
  nightlyList.innerHTML = template(NIGHTLYDATA);

  setSearchLogic();

  loading.innerHTML = ''; // remove the loading dots

  // show the table, with animated fade-in
  nightlyList.className = nightlyList.className.replace(/(?:^|\s)hide(?!\S)/g, ' animated fadeIn ');
  setTableRange();

  // if the table has a scroll bar, show text describing how to horizontally scroll
  var scrollText = document.getElementById('scroll-text');
  var tableDisplayWidth = document.getElementById('nightly-list').clientWidth;
  var tableScrollWidth = document.getElementById('nightly-list').scrollWidth;
  if (tableDisplayWidth != tableScrollWidth) {
    scrollText.className = scrollText.className.replace(/(?:^|\s)hide(?!\S)/g, '');
  }
}

function setTableRange() {
  var rows = $('#nightly-table tr');
  var selectedDate = moment(datepicker.value, 'MM-DD-YYYY').format();
  var visibleRows = 0;

  for (i = 0; i < rows.length; i++) {
    var thisDate = rows[i].getElementsByClassName('nightly-release-date')[0].innerHTML;
    var thisDateMoment = moment(thisDate, 'D MMMM YYYY').format();
    var isAfter = moment(thisDateMoment).isAfter(selectedDate);
    if (isAfter === true || visibleRows >= numberpicker.value) {
      rows[i].classList.add('hide');
    } else {
      rows[i].classList.remove('hide');
      visibleRows++;
    }
  }

  checkSearchResultsExist();
}

function setSearchLogic() {
  // logic for the realtime search box...
  var $rows = $('#nightly-table tr');
  $('#search').keyup(function () {
    var val = '^(?=.*' + $.trim($(this).val()).split(/\s+/).join(')(?=.*') + ').*$',
        reg = RegExp(val, 'i'),
        text;

    $rows.show().filter(function () {
      text = $(this).text().replace(/\s+/g, ' ');
      return !reg.test(text);
    }).hide();

    checkSearchResultsExist();
  });
}

function checkSearchResultsExist() {
  var numOfVisibleRows = $('#nightly-table').find('tr:visible').length;
  if (numOfVisibleRows == 0) {
    tableContainer.style.visibility = 'hidden';
    searchError.className = '';
  } else {
    tableContainer.style.visibility = '';
    searchError.className = 'hide';
  }
}
'use strict';

var RELEASEDATA;

// When releases page loads, run:
/* eslint-disable no-unused-vars */
function onLatestLoad() {
  /* eslint-enable no-unused-vars */

  RELEASEDATA = new Object();
  populateLatest(); // populate the Latest page
}

// LATEST PAGE FUNCTIONS
/* eslint-disable no-undef */
function populateLatest() {
  loadPlatformsThenData(function () {

    var handleResponse = function handleResponse(response) {

      // create an array of the details for each asset that is attached to a release
      var assetArray = response.binaries;

      if (assetArray.length === 0) {
        return false;
      }

      var repoName = getRepoName(true, 'releases');

      loadJSON(repoName, 'jck', function (response_jck) {

        var jckJSON = {};
        if (response_jck !== null) {
          jckJSON = JSON.parse(response_jck);
        }

        buildLatestHTML(response, jckJSON, assetArray);
      });

      return true;
    };

    loadAssetInfo(variant, jvmVariant, 'releases', 'latest', handleResponse, function () {
      errorContainer.innerHTML = '<p>There are no releases available for ' + variant + ' on the ' + jvmVariant + ' jvm. Please check our <a href=nightly.html?variant=' + variant + '&jvmVariant=' + jvmVariant + ' target=\'blank\'>Nightly Builds</a>.</p>';
      loading.innerHTML = ''; // remove the loading dots
    });
  });
}

function buildLatestHTML(releasesJson, jckJSON, assetArray) {

  // populate with description
  var variantObject = getVariantObject(variant + '-' + jvmVariant);
  if (variantObject.descriptionLink) {
    document.getElementById('description_header').innerHTML = 'What is ' + variantObject.description + '?';
    document.getElementById('description_link').innerHTML = 'Find out here';
    document.getElementById('description_link').href = variantObject.descriptionLink;
  }
  // populate the page with the release's information
  var publishedAt = releasesJson.timestamp;
  document.getElementById('latest-build-name').innerHTML = '<var release-name>' + releasesJson.release_name + '</var>';
  document.getElementById('latest-build-name').href = 'https://github.com/AdoptOpenJDK/' + getRepoName(true, 'releases') + '/releases/tag/' + releasesJson.release_name;
  document.getElementById('latest-date').innerHTML = '<var>' + moment(publishedAt).format('D') + '</var> ' + moment(publishedAt).format('MMMM') + ' <var>' + moment(publishedAt).format('YYYY') + '</var>';
  document.getElementById('latest-timestamp').innerHTML = publishedAt.slice(0, 4) + publishedAt.slice(8, 10) + publishedAt.slice(5, 7) + publishedAt.slice(11, 13) + publishedAt.slice(14, 16);

  var ASSETARRAY = [];
  // for each asset attached to this release, check if it's a valid binary, then add a download block for it...
  assetArray.forEach(function (eachAsset) {
    var ASSETOBJECT = new Object();
    var nameOfFile = eachAsset.binary_name;
    var uppercaseFilename = nameOfFile.toUpperCase(); // make the name of the asset uppercase
    ASSETOBJECT.thisPlatform = getSearchableName(uppercaseFilename); // get the searchableName, e.g. MAC or X64_LINUX.

    // check if the platform name is recognised...
    if (ASSETOBJECT.thisPlatform) {
      ASSETOBJECT.thisLogo = getLogo(ASSETOBJECT.thisPlatform);
      ASSETOBJECT.thisPlatformOrder = getPlatformOrder(ASSETOBJECT.thisPlatform);
      ASSETOBJECT.thisOfficialName = getOfficialName(ASSETOBJECT.thisPlatform);

      if (jckJSON == null || Object.keys(jckJSON).length == 0) {
        ASSETOBJECT.thisVerified = false;
      } else {
        if (jckJSON[releasesJson.release_name] && jckJSON[releasesJson.release_name].hasOwnProperty(ASSETOBJECT.thisPlatform)) {
          ASSETOBJECT.thisVerified = true;
        } else {
          ASSETOBJECT.thisVerified = false;
        }
      }

      // if the filename contains both the platform name and the matching INSTALLER extension, add the relevant info to the asset object
      ASSETOBJECT.thisInstallerExtension = getInstallerExt(ASSETOBJECT.thisPlatform);
      ASSETOBJECT.thisBinaryExtension = getBinaryExt(ASSETOBJECT.thisPlatform);
      if (uppercaseFilename.indexOf(ASSETOBJECT.thisInstallerExtension.toUpperCase()) >= 0) {
        if (ASSETARRAY.length > 0) {
          ASSETARRAY.forEach(function (asset) {
            if (asset.thisPlatform === ASSETOBJECT.thisPlatform) {
              ASSETARRAY.pop();
            }
          });
        }
        ASSETOBJECT.thisPlatformExists = true;
        ASSETOBJECT.thisInstallerExists = true;
        ASSETOBJECT.thisInstallerLink = eachAsset.binary_link;
        ASSETOBJECT.thisInstallerSize = Math.floor(eachAsset.binary_size / 1024 / 1024);
        ASSETOBJECT.thisBinaryExists = true;
        ASSETOBJECT.thisBinaryLink = eachAsset.binary_link.replace(ASSETOBJECT.thisInstallerExtension, ASSETOBJECT.thisBinaryExtension);
        ASSETOBJECT.thisBinarySize = Math.floor(eachAsset.binary_size / 1024 / 1024);
        ASSETOBJECT.thisChecksumLink = eachAsset.binary_link.replace(ASSETOBJECT.thisInstallerExtension, '.sha256.txt');
      }
      // if the filename contains both the platform name and the matching BINARY extension, add the relevant info to the asset object
      if (uppercaseFilename.indexOf(ASSETOBJECT.thisBinaryExtension.toUpperCase()) >= 0) {
        var installerExist = false;
        if (ASSETARRAY.length > 0) {
          ASSETARRAY.forEach(function (asset) {
            if (asset.thisPlatform === ASSETOBJECT.thisPlatform) {
              installerExist = true;
            }
          });
        }
        if (!installerExist) {
          ASSETOBJECT.thisPlatformExists = true;
          ASSETOBJECT.thisBinaryExists = true;
          ASSETOBJECT.thisBinaryLink = eachAsset.binary_link;
          ASSETOBJECT.thisBinarySize = Math.floor(eachAsset.binary_size / 1024 / 1024);
          ASSETOBJECT.thisChecksumLink = eachAsset.checksum_link;
        }
      }

      if (ASSETOBJECT.thisPlatformExists === true) {
        ASSETARRAY.push(ASSETOBJECT);
      }
    }
  });

  ASSETARRAY = orderPlatforms(ASSETARRAY);

  RELEASEDATA.htmlTemplate = ASSETARRAY;
  var templateSelector = Handlebars.compile(document.getElementById('template-selector').innerHTML);
  var templateInfo = Handlebars.compile(document.getElementById('template-info').innerHTML);
  document.getElementById('latest-selector').innerHTML = templateSelector(RELEASEDATA);
  document.getElementById('latest-info').innerHTML = templateInfo(RELEASEDATA);

  setTickLink();

  displayLatestPlatform();
  window.onhashchange = displayLatestPlatform;

  loading.innerHTML = ''; // remove the loading dots

  var latestContainer = document.getElementById('latest-container');
  latestContainer.className = latestContainer.className.replace(/(?:^|\s)invisible(?!\S)/g, ' animated fadeIn '); // make this section visible (invisible by default), with animated fade-in
}

/* eslint-disable no-unused-vars */
function selectLatestPlatform(thisPlatform) {
  /* eslint-enable no-unused-vars */
  window.location.hash = thisPlatform.toLowerCase();
}

function displayLatestPlatform() {
  var platformHash = window.location.hash.substr(1).toUpperCase();
  var thisPlatformInfo = document.getElementById('latest-info-' + platformHash);
  if (thisPlatformInfo) {
    unselectLatestPlatform('keep the hash');
    document.getElementById('latest-selector').classList.add('hide');
    thisPlatformInfo.classList.remove('hide');
  }
}

function unselectLatestPlatform(keephash) {
  if (!keephash) {
    history.pushState('', document.title, window.location.pathname + window.location.search);
  }
  var platformButtons = document.getElementById('latest-selector').getElementsByClassName('latest-asset');
  var platformInfoBoxes = document.getElementById('latest-info').getElementsByClassName('latest-info-container');

  for (i = 0; i < platformButtons.length; i++) {
    platformInfoBoxes[i].classList.add('hide');
  }

  document.getElementById('latest-selector').classList.remove('hide');
}
'use strict';

// https://tc39.github.io/ecma262/#sec-array.prototype.findIndex
if (!Array.prototype.findIndex) {
  Object.defineProperty(Array.prototype, 'findIndex', {
    value: function value(predicate) {
      // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If IsCallable(predicate) is false, throw a TypeError exception.
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }

      // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
      var thisArg = arguments[1];

      // 5. Let k be 0.
      var k = 0;

      // 6. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
        // d. If testResult is true, return k.
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return k;
        }
        // e. Increase k by 1.
        k++;
      }

      // 7. Return -1.
      return -1;
    }
  });
}