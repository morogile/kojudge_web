sukoaProject = {
  topZIndex : 10,
  startingX : 354,
  startingY : 90,
  offsetY : 36,
  offsetX : 30,
  nbMaxPerDiag: 15,
  diagOffset: 400,
  rootURL: null,
  myList: null,
  nbSlidesPerSide: 5,
  reloadSlidesGap: 0,
  projectsIndexWindows: null,
  sliders: {},
  windowtemplate: '<div class="standard windowItem focusedWindow" style="z-index: 9999999;">' +
                      '<div class="windowWrapperContent">'+
                          '<div class="windowMETA">'+
                          '   <h1>LOADING CONTENT</h1>'+
                          '</div>'+
                      '</div>'+
                  '</div>',

  touchDevice: 'ontouchstart' in window || navigator.msMaxTouchPoints,
  init : function(){
      if(sukoaProject.rootURL === null) {
          sukoaProject.rootURL = sukoaUtils.getCurrentURL(true);
      }
      sukoaProject.mainWrapper = $("#main-wrapper");
      sukoaProject.subNav = $("#sub-nav");
      sukoaUtils.bindCacheKillerLinkFn();
      sukoaUtils.bindCacheKillerImgsFn();
      sukoaUtils.openExternalLinksInNewWindow();
      windowsGrid = [];
      var sliderWidth = 718;
      if($(document).width() < sukoaProject.startingX + sliderWidth) {
          sukoaProject.startingX = 290;
      }
      if (sukoaProject.touchDevice) {
          $('body').addClass("touch");
      }

  },

  includeAllowCookiesButton: function() {

      if($.cookie("cookiesAllowed") !== "1") {
          var $footer = $("footer");
          $footer.addClass("cookies-alert");
          var privacylink = "";
          var $a = $footer.find("p:first-child a:first-child");
          if($a.length > 0 && $a.attr("href") !== "") {
              privacylink = $a.attr("href");
          }

          var template = '<p class="cookies-warning"><span>|</span><span class="allow-cookies">ALLOW</span>';
          if(privacylink !== "") {
              template += '<span>US TO USE <a href="'+privacylink+'">COOKIES</a></span>';
          } else {
              template += '<span>US TO USE COOKIES</span>';
          }
          template += '</p>';
          $footer.append($(template));
          $footer.on("click", ".allow-cookies", function () {
              $footer.removeClass("cookies-alert");
              $.cookie("cookiesAllowed", 1, {path: '/'});
          })
      }
  },

  //---------------- Ajax Load ----------------//
  dispatchLoadFunctions : function($link, isNavLink) {
      if(typeof $link !== "undefined" && $link.size()>0){
          var href = $link.attr("href");
          if(sukoaUtils.isMobile()){
              window.location.href = href;
          } else {
              var typeToLoad = $link.attr("data-windowtype");
              if(typeof typeToLoad === typeof undefined || typeToLoad === false || typeToLoad === "") {
                  typeToLoad = "0";
              }
              loadFunctions[typeToLoad](href, isNavLink);

              if((typeof isNavLink !== "undefined" && isNavLink) && typeToLoad !== "2") {
                  sukoaProject.emptySubNav();
              }
          }
      }
  },

  loadWindow : function(href){
      var url = href;
      if(sukoaProject.windowExists(url)){
          var existingWindow = sukoaProject.getWindowByHandle(url);
          sukoaProject.setTopWindow(existingWindow);
          sukoaProject.highlightSearchTerm($(".windowWrapperContent", existingWindow));
      }else{
          var $tempWindow = $(sukoaProject.windowtemplate);
          var css = sukoaProject.defineNewWindowPosition($tempWindow);
          sukoaProject.mainWrapper.append($tempWindow);
          $.get(url, function(data) {

              var responseObject = $(data);
              var w = responseObject.find(".windowItem");
              if(w.size()>0) {
                  w.css(css);
                  $($tempWindow).replaceWith(w);
                  sukoaProject.setTopWindow(w);
                  sukoaProject.appendDragInteraction();
                  sukoaProject.appendScrollInteraction(w);
              } else {
                  $tempWindow.remove();
              }
              sukoaProject.highlightSearchTerm($(".windowWrapperContent", w));

          });
      }
  },

  loadSlider : function(href, isProjectListSS){

      var url = href;
      var imguuid = "";
      var startPosition = 0;
      if (href.indexOf("?") !== -1) {
          url = href.substring(0,href.indexOf("?"));
          imguuid = sukoaUtils.getParameterByNameGivenURL(href,"img");
      }

      if(sukoaProject.windowExists(url)){
          var existingWindow = sukoaProject.getWindowByHandle(url);
          var containerId = existingWindow.find(".swiper-container").attr("id");
          if(imguuid !== "") {
              startPosition = sukoaProject.startPositionWithImageID(containerId, imguuid);
          } else {
              if(typeof sukoaProject.sliders[containerId]["position"] !== typeof undefined && sukoaProject.sliders[containerId]["position"] !== null) {
                  startPosition = sukoaProject.sliders[containerId]["position"]-1;
              }
          }
          sukoaProject.instanciateSlider(existingWindow, startPosition);
          sukoaProject.setTopWindow(existingWindow);

      }else{
          var slideShow = $("#slideShow");
          if(isProjectListSS) {
              slideShow.addClass("blocked");
          }
          var $sliderWindow = $(sukoaProject.windowtemplate.replace("standard", "gallery"));
          var css = sukoaProject.defineNewWindowPosition($sliderWindow);
          sukoaProject.mainWrapper.append($sliderWindow);

          $.get(url, function(data) {
              var responseObject = $(data);
              var w = responseObject.find(".windowItem");
              var gallery = w.find(".gallery");
              if(gallery.size()>0) {
                  w.css(css);
                   $sliderWindow.replaceWith(w);

                  if(imguuid !== "") {
                      var containerId = w.find(".swiper-container").attr("id");
                      sukoaProject.prepareJsonObjectForSlider(containerId, null,isProjectListSS);
                      startPosition = sukoaProject.startPositionWithImageID(containerId, imguuid);
                  }
                  sukoaProject.instanciateSlider(w, startPosition);
                  sukoaProject.setTopWindow(w);
                  sukoaProject.appendDragInteraction();

                  if(isProjectListSS && slideShow.hasClass("blocked")) {
                      if(typeof sukoaProject.myList !== typeof undefined && sukoaProject.myList !== null) {
                          sukoaProject.myList.updateSlideShow(0);
                      }
                      slideShow.removeClass("blocked");
                  }
              } else {
                  $sliderWindow.remove();
              }
          });
      }
  },

  loadSubNav: function(href, compareActiveLi) {
      if(typeof compareActiveLi === typeof undefined || compareActiveLi === null) {
          compareActiveLi = false;
      }

      var searchedterm = "";
      if($("#searchTerm").size()>0) {
          searchedterm = $("#searchTerm").attr("data-term");
      }


      $.get(href, function (data) {
          var responseObject = $(data);
          var w = responseObject.find("#sub-nav");
          var current = sukoaProject.subNav;
          // if(w.html() !== current.html()){
              //check if active link still the same after ajax request.
              var $activeLi = $("#main-nav").find("li.active");
              if($activeLi.find("li.active").size()>0){
                  $activeLi = $activeLi.find("li.active");
              }

              var $activeLink = $activeLi.find(">a");
              if( !compareActiveLi || $activeLink.attr("href") === href){
                  sukoaProject.subNav.html(w.html());
                  sukoaProject.updateActiveNavLink(href, compareActiveLi);
              }
          // }


          sukoaProject.putNavigationOnTop();
          sukoaProject.checkIfSubNavEmpty();
          sukoaProject.highlightSearchTerm($("#sub-nav", $(".scrollNav")), searchedterm);

      });
  },

  loadAnonymous: function(href) {
      var url = href;
      var imguuid = null;
      var sliderStartPosition = 0;
      if (href.indexOf("?") !== -1) {
          url = href.substring(0,href.indexOf("?"));
          imguuid = sukoaUtils.getParameterByNameGivenURL(href,"img");
      }

      if(sukoaProject.windowExists(url)){
          var existingWindow = sukoaProject.getWindowByHandle(url);
          if(existingWindow.find(".gallery").size()>0) {
              if(imguuid !== "undefined" ){
                  var containerId = existingWindow.find(".swiper-container").attr("id");
                  sliderStartPosition = sukoaProject.startPositionWithImageID(containerId, imguuid);
                  sukoaProject.instanciateSlider(existingWindow, sliderStartPosition);
              }
          }
          sukoaProject.setTopWindow(existingWindow);
          sukoaProject.highlightSearchTerm($(".windowWrapperContent", existingWindow));
      }else{

          $.get(url, function(data) {
              var responseObject = $(data);
              var w = responseObject.find(".windowItem");
              if(w.size()>0) {
                  var isSlider = w.find(".gallery").size()>0;
                  var isVideo = w.hasClass("video");


                  if(isSlider || isVideo || (typeof w !== "undefined" && w.find(".overview").children().size()>0)) {
                      sukoaProject.defineNewWindowPosition(w);
                      sukoaProject.mainWrapper.append(w);
                      if(isSlider) {
                          if(imguuid !== null ){
                              var containerId = w.find(".swiper-container").attr("id");
                              sliderStartPosition = sukoaProject.startPositionWithImageID(containerId, imguuid);
                          }
                          sukoaProject.instanciateSlider(w, sliderStartPosition);
                      }
                      sukoaProject.setTopWindow(w);
                      sukoaProject.appendDragInteraction();
                      sukoaProject.appendScrollInteraction(w);
                  }
              } else {
                  //is focus
                  sukoaProject.showFocus(responseObject,url);
              }
              sukoaProject.highlightSearchTerm($(".windowWrapperContent", w));
          });
      }
  },

  loadVideo: function(href) {
      var url = href;
      if(sukoaProject.windowExists(url)){
          var existingWindow = sukoaProject.getWindowByHandle(url);
          sukoaProject.setTopWindow(existingWindow);
          sukoaProject.highlightSearchTerm($(".windowWrapperContent", existingWindow));
      }else{
          var $tempWindow = $(sukoaProject.windowtemplate.replace("standard", "video"));
          var css = sukoaProject.defineNewWindowPosition($tempWindow);
          sukoaProject.mainWrapper.append($tempWindow);
          $.get(url, function(data) {

              var responseObject = $(data);
              var w = responseObject.find(".windowItem");
              if(w.size()>0) {
                  w.css(css);
                  $($tempWindow).replaceWith(w);
                  sukoaProject.setTopWindow(w);
                  sukoaProject.appendDragInteraction();
                  sukoaProject.appendScrollInteraction(w);
              } else {
                  $tempWindow.remove();
              }
              sukoaProject.highlightSearchTerm($(".windowWrapperContent", w));

          });
      }
  },

  loadFocus: function(href) {

      var url = href;
      $.get(url, function(data) {
          var responseObject = $(data);
          sukoaProject.showFocus(responseObject,url);
      });
  },

  loadProjectsIndex: function(href) {
      var url = href;
      if(sukoaProject.windowExists(url)){
          var existingWindow = sukoaProject.getWindowByHandle(url);
          sukoaProject.setTopWindow(existingWindow);
          sukoaProject.highlightSearchTerm($(".windowWrapperContent", existingWindow));
      }else{
          var $tempWindow = $(sukoaProject.windowtemplate.replace('standard', 'projectsIndex'));
          var xy = {x: sukoaProject.startingX + 400, y: sukoaProject.startingY - 20}
          var css = sukoaProject.defineNewWindowPosition($tempWindow, xy);
          sukoaProject.mainWrapper.append($tempWindow);
          $.get(url, function(data) {
              var responseObject = $(data);
              var w = responseObject.find(".windowItem");
              if(w.size()>0) {
                  w.css(css);
                  $($tempWindow).replaceWith(w);
                  sukoaProject.setTopWindow(w);
                  sukoaProject.appendDragInteraction();
                  sukoaProject.appendScrollInteraction(w);
                  sukoaProject.initProjectsIndexWindow(w);

              } else {
                  $tempWindow.remove();
              }
              sukoaProject.highlightSearchTerm($(".windowWrapperContent", w));

          });
      }
  },


  //---------------- Persistance ----------------//
  loadWindowsFromSession : function(){
      var href = sukoaUtils.getCurrentURL(true)+"?ajaxCMD=getall&ck="+new Date().getTime();
      var $gallery = sukoaProject.mainWrapper.find(".windowItem.gallery");
      if($gallery.size()>0){
          $gallery.each(function(){
              sukoaProject.instanciateSlider($(this), 0);
          })
      }

      $.get(href, function(data) {
          var windowArray = jQuery.parseJSON( data );
          $.each(windowArray, function(i, obj) {
              var handle = obj.handle;
              var existingWindow = sukoaProject.getWindowByHandle(handle);
              if(existingWindow.length>0){
                  sukoaProject.setWindowDetailsFromJson(existingWindow,obj);
              }else{
                  var w;
                  $.get(handle, function(data) {
                      var responseObject = $(data);
                      w = responseObject.find(".windowItem");
                      sukoaProject.setWindowDetailsFromJson(w,obj);
                      sukoaProject.appendDragInteraction();

                  });
              }
          });
      });
  },

  setWindowDetailsFromJson : function(windowObj,jsonObj){
      var top = jsonObj.top;
      var left = jsonObj.left;
      //var zindex = jsonObj.zindex;
      var zindex = 10;
      var scrolltop = jsonObj.scrolltop;
      windowObj.css("top",top+"px");
      windowObj.css("left",left+"px");

      if(zindex>sukoaProject.topZIndex){
          sukoaProject.topZIndex = zindex;
      } else if (zindex === sukoaProject.topZIndex){
          zindex++;
          sukoaProject.topZIndex++;
      }else {
          windowObj.removeClass("focusedWindow");
      }
      windowObj.css("zIndex",zindex);

      if (windowObj.hasClass('projectsIndex')) {
          var projIndexJson = jsonObj.projectsIndex;
          if(projIndexJson) {

              if(projIndexJson.listView) {
                  var grid = windowObj.find('.index-wrapper.grid');
                  if(grid.length > 0) {
                      grid.addClass('list').removeClass('grid');
                  }
                  var switchView = windowObj.find('.switchview');
                  if(switchView.length > 0) {
                      switchView.removeClass('grid').addClass('list');
                  }
              }
          }
          sukoaProject.initProjectsIndexWindow(windowObj);
          if(projIndexJson.reverseOrder) {
              sukoaProject.reverseOrder(windowObj);
          }
      }

      sukoaProject.mainWrapper.append(windowObj);
      sukoaProject.updateScrollPosition(windowObj,scrolltop);
      if(windowObj.hasClass("gallery")){
          windowObj.attr("data-slidenb", jsonObj.slideNb);
          if(jsonObj.lastActiveSlideContent !== "") {
              var swiperPreloader = windowObj.find(".swiper-lazy-preloader");
              swiperPreloader.addClass("show-lastactive-content");
              swiperPreloader.css("background-image", "url('"+jsonObj.lastActiveSlideContent+"')");

              var swiperText = windowObj.find(".slider-text");
              swiperText.find(".imglgd.showed-text").addClass("hide");
              swiperText.prepend('<p class="imglgd lastActive">'+jsonObj.lastActiveLegend+'</p>')
          }
          windowObj.find(".windowInfo").text(jsonObj.pagination);

          sukoaProject.instanciateSlider(windowObj, jsonObj.slideNb);
      }



      if(sukoaUtils.getCurrentURL(true).indexOf((jsonObj.handle))!== -1) {
          sukoaProject.setTopWindow(windowObj);
      }

  },

  persistWindowDetails : function(windowItem){
      var commURL = sukoaUtils.getCurrentURL(true)+"?ajaxCMD=persist&ck="+new Date().getTime();
      if(typeof windowItem.attr("class") !== "undefined" && !sukoaProject.checkIsFocus(windowItem)) {
          var type = windowItem.attr('class').split(' ')[0];
          var uuid = windowItem.attr("id");
          var handle = windowItem.attr("data-pagepath");
          var top = sukoaUtils.getInt(windowItem.css("top"));
          var left = sukoaUtils.getInt(windowItem.css("left"));
          var zindex = sukoaUtils.getInt(windowItem.css("zIndex"));
          var scrolltop = 0;
          if(windowItem.find(".form-wrapper").size()===0) {
              scrolltop = sukoaProject.getWindowScrollPosition(windowItem);
          }

          var slideNb = -1;
          var pagination = "";
          var lastAciveSlideContent = "";
          var lastActiveLegend = "";
          var windowtype = 1;
          if(windowItem.hasClass("gallery")) {
              var $activeSlide = windowItem.find(".swiper-slide-active");
              var containerId = windowItem.find(".swiper-container").attr("id");
              slideNb = sukoaProject.sliders[containerId]["position"];
              if(typeof slideNb !== typeof undefined) {
                  slideNb--
              } else {
                  slideNb = 0;
              }
              if(sukoaProject.sliders[containerId]["slides"].length > 0) {
                  lastAciveSlideContent = sukoaProject.sliders[containerId]["slides"][slideNb].asset;
              }
              pagination = windowItem.find(".swiper-pagination-custom").text();
              lastActiveLegend = $activeSlide.find(".slider-text .showed-text").text();
              windowtype = 3;
          }
          var projectsIndex = {};
          if(windowItem.hasClass("projectsIndex")) {
              projectsIndex = {
                  "listView": windowItem.find('.index-wrapper.list').length > 0,
                  "reverseOrder": windowItem.find('.switchorder.reverse').length > 0,
              }
          }
          var json = {"type":type,"uuid":uuid,"handle":handle,"top":top,"left":left,"zindex":zindex,"scrolltop":scrolltop, "slideNb":slideNb, "pagination": pagination, "lastActiveSlideContent": lastAciveSlideContent, "lastActiveLegend": lastActiveLegend, "windowtype": windowtype,
              "projectsIndex": projectsIndex
          };
          $.ajax({
              url: commURL,
              type: 'POST',
              contentType:'application/json',
              data: JSON.stringify(json),
              dataType:'json'
          });
      }

  },

  historyUpdate : function(destination){

      if(destination){
          if(history.pushState) {
              history.pushState(null, null, destination.toLocaleLowerCase());
          }
          if(!sukoaUtils.checkIsEditMode() && typeof ga !== 'undefined'){
              ga('set', 'page', destination);
              ga('send', 'pageview');
          }
      }
  },

  trackEvent: function(category, action, label) {
      if(typeof ga !== typeof undefined && category && action && label) {
          ga('send', {
              hitType: 'event',
              eventCategory: category, //ex: Agenda
              eventAction: action, //ex: Exhibition preview, Date interaction
              eventLabel: label //exhibition name, url with param,
          });
      }
  },

  //---------------- Windows general----------------//


  appendScrollInteraction : function(window, scrolltop){
      if(!sukoaProject.touchDevice) { //TODO uncomment this when ready for ticket HdM-182Complete Works List-scroll on Ipads
          var sw;
          if(typeof window !== "undefined") {
              sw = window.find(".scrollWindow");
          }else{
              sw = $(".scrollWindow");
          }

          sw.tinyscrollbar({thumbSize: 20});

          if(typeof scrolltop !== "undefined") {
              var sb = sw.data("plugin_tinyscrollbar");
              if(typeof sb !== "undefined") {
                  sb.update(scrolltop);
              }
          }
          sw.click(function(){
              var sb = sw.data("plugin_tinyscrollbar");
              if(typeof sb !== "undefined") {
                  sb.update("relative");
              }
          });
      }
      setTimeout(function() {
          sukoaProject.loadImagesInRange();
      }, 700);
  },

  appendScrollInteractionOnSubNav : function(relative){
      if(!sukoaProject.touchDevice) { //TODO uncomment this when ready for ticket HdM-182Complete Works List-scroll on Ipads
          var sw = $(".scrollNav");
          sw.tinyscrollbar({thumbSize: 20});
          var sb = sw.data("plugin_tinyscrollbar");
          if(typeof sb !== "undefined") {
              if(typeof relative === "undefined" || !relative) {
                  sb.update(0);

              } else {
                  sb.update("relative");
              }

          } else {
              sb.update("relative");
          }
      } else {
          $('#sub-nav').parent(".viewport").scrollTop(0);
      }
  },

  appendScrollInteractionOnProjectsFilters : function(){
      if(!sukoaProject.touchDevice) {
          var sw = $("#main-nav .scrollFilter");
          if(sw.find(".scrollbar").size()>0) {
              sw.tinyscrollbar({thumbSize: 20});
              var sb = sw.data("plugin_tinyscrollbar");
              var $activeOption = sw.find(".option.active");
              if ($activeOption.size() > 0) {
                  var $viewport = sw.find(".viewport");
                  var $overview = $viewport.find(".overview");
                  var scrollTo = ($activeOption.offset().top - $viewport.outerHeight()) - ($overview.css("top").replace("px","")*1);
                  if (scrollTo < 0) {
                      scrollTo = 0;
                  }
                  sb.update(scrollTo);
              } else {
                  sb.update(0);
              }
          }
      }
  },

  updateScrollPosition : function(windowItem, scrolltop){
      if(!sukoaProject.touchDevice) {
          var selector = ".scrollWindow";
          if(!windowItem.hasClass("windowItem") && !windowItem.hasClass("lightbox-wrapper")){
              selector = ".scrollNav";
          }

          var sw = windowItem.find(selector);
          if(sw.length>0){

              var sb = sw.data("plugin_tinyscrollbar");

              if(typeof sb !== "undefined") {
                  if(typeof scrolltop === "undefined") {
                      sb.update("relative");
                  } else {
                      sb.update(scrolltop);
                  }

              } else {
                  sukoaProject.appendScrollInteraction(windowItem, scrolltop);
              }
          }
      }
  },

  appendDragInteraction : function(){
      var isSafari = navigator.userAgent.toLowerCase().indexOf('safari/') > -1;
      $(".windowItem").not(".ui-draggable").draggable({cursor: "move", containment: [20,40], scroll: true, handle: '.windowDragHandle'
          ,start: function() {
              sukoaProject.setTopWindow($(this));
              if(isSafari){$(this).addClass("safaridragging");}
          },drag: function(event, ui) {
              if(sukoaProject.touchDevice) {
                  //$(this).find(".gallery").css("visibility", "hidden");
                  $(this).find(".gallery").hide();
              }
          },stop: function(event, ui) {
              $("body").toggleClass("rerender");
              /* persist window position */
              sukoaProject.persistWindowDetails($(this));
              if(isSafari){$(this).removeClass("safaridragging");}
              if(sukoaProject.touchDevice) {
                  //$(this).find(".gallery").css("visibility", "visible");
                  $(this).find(".gallery").show();
              }
          }
      }).bind("click", function(e){
          /* make sure clicked windows are on top */
           sukoaProject.setTopWindow($(this));
      });
  },

  getWindowScrollPosition : function(windowItem){
      var t = 0;
      var overview = windowItem.find(".overview");
      if(overview.length>0){
          t = overview.css("top");
      }
      return sukoaUtils.getInt(t);
  },

  defineNewWindowPosition : function($window, position) {
      var done = false;
      var diagNb = 0;
      var xpos = sukoaProject.startingX;
      var ypos = sukoaProject.startingY;

      if(!position || !position.x ||!position.y) {
          do {
              for(var i = 0; i < sukoaProject.nbMaxPerDiag; i++) {
                  xpos = sukoaProject.offsetX * i + sukoaProject.startingX + diagNb * (sukoaProject.nbMaxPerDiag * sukoaProject.offsetX + sukoaProject.diagOffset);
                  ypos = sukoaProject.offsetY * i + sukoaProject.startingY;
                  var occupied = false;
                  sukoaProject.mainWrapper.find(".windowItem").each(function () {
                      var $this = $(this);
                      if ((xpos + ypos) - (sukoaUtils.getInt($this.css("top")) + sukoaUtils.getInt($this.css("left"))) === 0) {
                          occupied = true;
                      }
                  });
                  if (!occupied) {
                      done = true;
                      break;
                  }
              }
              if(!done) {
                  diagNb++;
              }
              if(diagNb>3) {
                  done = true;
              }
          } while(!done);
      } else {
          xpos= position.x;
          ypos = position.y;
      }
      var css = {"top":ypos+"px","left":xpos+"px"};
      $window.css(css);
      return css;
  },

  getWindowByHandle : function(href){
      var url;
      if (href.indexOf("?") === -1) {
          url = href;
      } else {
          url = href.substring(0,href.indexOf("?"));
      }

      return sukoaProject.mainWrapper.find("[data-pagepath='" + url + "']");
  },

  windowExists : function(href){
      var foundItem = sukoaProject.getWindowByHandle(href);
      if(sukoaProject.checkIsFocus(foundItem)) {
          return false;
      } else {
          return foundItem.length>0;
      }
  },

  setTopWindow : function(currentWindow){

      //todo if window on top, close window ??
      sukoaProject.mainWrapper.find(  ".focusedWindow").removeClass("focusedWindow");
      currentWindow.addClass("focusedWindow");
      var isGallery = currentWindow.hasClass("gallery");
      if(isGallery){
          var lastActiveText = currentWindow.find("p.lastActive");
          if (lastActiveText.size() > 0) {
              lastActiveText.remove();
          }
          currentWindow.find("p.imglgd.showed-text").removeClass("hide");

          sukoaProject.handleKeyboardSlideNav();
      }
      sukoaProject.topZIndex++;
      currentWindow.css("zIndex", sukoaProject.topZIndex);
      document.title = currentWindow.attr("data-windowtitle");
      $("meta[property='og:title']").attr("content", currentWindow.attr("data-ogtitle"));
      $("meta[property='og:description']").attr("content", currentWindow.attr("data-ogdescription"));
      $('meta[property="og:url"]').attr("content", currentWindow.attr("data-ogurl"));
      var ogimtag =$("meta[property='og:image']");
      if(currentWindow.attr("data-ogimage") !== "") {
          if(ogimtag.size()>0){
              ogimtag.attr("content", currentWindow.attr("data-ogimage"));
          } else {
              $("head").append('<meta property="og:image" content="'+currentWindow.attr("data-ogimage")+'">');
          }
      } else if (ogimtag.size()>0){
          ogimtag.remove();
      }

      sukoaProject.historyUpdate(currentWindow.attr("data-pagepath"));
      sukoaProject.persistWindowDetails(currentWindow);
  },

  removerefreshparameter: function() {
      if(sukoaUtils.getParameterByName("refresh") !== "") {
          var url = sukoaUtils.getCurrentURL(true);
          history.pushState(null, null, url);
      }
  },

  closeWindow: function($element) {
      var href = sukoaUtils.getCurrentURL(true)+"?ajaxCMD=remove&uuid="+$element.attr("id")+"&ck="+new Date().getTime();
      if($element.hasClass('projectsIndex')) {
          sukoaProject.projectsIndexWindows = null;
      }
      $.get(href);
      $element.remove();
  },

  appendWindowInteraction : function(){
      $("body").on("click", ".lightbox-nav a", function(e) {
          e.preventDefault();
          e.stopPropagation();
          //sukoaProject.loadWindow($(this).attr("href"));
          sukoaProject.dispatchLoadFunctions($(this));
      });

      $("body").on("click", ".lightbox .collapsible .title", function(e) {
          e.preventDefault();
          e.stopPropagation();
          var $this = $(this);
          sukoaProject.appendScrollInteraction();
          $this.parent().toggleClass("collapsed").promise().done(function(){
              var $currentWindow = $this.closest(".lightbox-wrapper");
              sukoaProject.updateScrollPosition($currentWindow);
          });

      });

      sukoaProject.mainWrapper.on("click", ".windowItem .collapsible .title", function(e) {
          var $this = $(this);
          $this.parent().toggleClass("collapsed").promise().done(function(){
              sukoaProject.appendScrollInteraction();
              var $currentWindow = $this.closest(".focusedWindow");
              sukoaProject.updateScrollPosition($currentWindow);
          });

      });

      $("#sub-nav").on("click", ".collapsible .title", function() {
          var $this = $(this);
          sukoaProject.appendScrollInteractionOnSubNav(true);
          $this.parent().toggleClass("collapsed").promise().done(function(){
              sukoaProject.updateScrollPosition($("#main-nav-wrapper"));
          });
      });

      $('body').on("click", ".gallery .swiper-button", function(e){
          e.preventDefault();
          e.stopPropagation();
          var $this = $(this);
          var $window = $this.closest('.lightbox-wrapper');
          var mySwiper = $window.find(".swiper-container")[0].swiper;
          if($this.hasClass("swiper-button-next")){
              mySwiper.slideNext();
          } else {
              mySwiper.slidePrev();
          }
      });

      sukoaProject.mainWrapper.on("click", ".gallery .swiper-button", function(e){
          e.preventDefault();
          e.stopPropagation();
          var $this = $(this);
          var $window = $this.closest(".windowItem");
          var mySwiper = $window.find(".swiper-container")[0].swiper;
          if($this.hasClass("swiper-button-next")){
              mySwiper.slideNext();
          } else {
              mySwiper.slidePrev();
          }
      });

      sukoaProject.mainWrapper.on("click",".windowCloser",function(e){
          e.stopPropagation();
          var currentWindow = $(this).closest(".windowItem");
          sukoaProject.closeWindow(currentWindow);
      });


      sukoaProject.mainWrapper.on("click", "#main-nav-wrapper", function(){
          sukoaProject.putNavigationOnTop();
      });

      sukoaProject.mainWrapper.on("click", ".gallery .galleryFullWidth", function(){
          sukoaProject.fullscreenSlider($(this).closest(".windowItem"));
      });

      //sukoaProject.mainWrapper.on("click", ".gallery", function(e){
      //    e.stopPropagation();
      //    var $this = $(this);
      //    var $window = $this.closest(".windowItem");
      //
      //});
      sukoaProject.mainWrapper.on("click",".windowItem",function(e){
          var currentWindow = $(this);
          if(!currentWindow.hasClass("gallery")){
              sukoaProject.appendScrollInteraction();
          }
      });
      sukoaProject.mainWrapper.on("click",".windowItem a",function(e){
          if(!sukoaUtils.isMobile()){
              e.stopPropagation();
              var a = $(this);
              var href = a.attr("href");
              if(href.indexOf("/")==0){
                  //if(href.indexOf(".jpg") === -1 && href.indexOf(".pdf") === -1 && href.indexOf(".png") === -1) {
                  if(href.indexOf(".html") !== -1) {
                      e.preventDefault();
                      //sukoaProject.loadWindow(href);
                      sukoaProject.dispatchLoadFunctions(a);
                  }
              }
          }
      });

      sukoaProject.mainWrapper.on("click","#sub-nav a",function(e){

          e.stopPropagation();
          var a = $(this);
          sukoaProject.putNavigationOnTop();
          var href = a.attr("href");
          if(href.indexOf("/")==0){
              //if(href.indexOf(".jpg") === -1 && href.indexOf(".pdf") === -1 && href.indexOf(".png") === -1) {
              if(href.indexOf(".html") !== -1) {
                  e.preventDefault();
                  sukoaProject.dispatchLoadFunctions(a);
              }
          }
      });

      sukoaProject.mainWrapper.on("click", "a.interface", function(e) {
          var a = $(this);
          var href = a.attr("href");
          if(href.indexOf("/") === 0){
              e.preventDefault();
              sukoaProject.dispatchLoadFunctions(a);
          }
      });

      sukoaProject.mainWrapper.on("click", "a#interface-refresh", function(e) {
          e.preventDefault();
          var a = $(this);
          sukoaProject.trackEvent('Interface', 'refresh', 'Refresh button');
          $.get('?refresh=true', function() {
              window.location.href = a.attr('href');
          });
          $('body').find('.windowItem').remove();
      });

      $('body').on("click", ".imglgd", function(e) {
          e.stopPropagation();
          var captions = $(this).parent().find(".imglgd");
          if(captions.size()>1) {
              $(this).addClass("hide").removeClass("showed-text");
              $(captions.get((captions.index(this)+1)%captions.size())).removeClass("hide").addClass("showed-text");
          }
      });

      sukoaProject.mainWrapper.on("click", ".list-component .date-folder", function(e) {
          var $this = $(this);
          var $currentWindow = $this.closest(".windowItem");
          if($currentWindow.size() === 0) {
              $currentWindow = $("#main-nav-wrapper");
          }
          $("#"+$this.attr("data-deploy")).slideToggle(function(){
              sukoaProject.updateScrollPosition($currentWindow);
          });
          $this.toggleClass("open");
      });

      $('body').on("click", "#statement_navigation a, footer a", function(e) {
          if(!$(this).hasClass("external-link")){
              e.preventDefault();
              sukoaProject.dispatchLoadFunctions($(this));
          }
      });

      sukoaProject.mainWrapper.on("click", "#sub-nav .showMoreBtn", function(){
          var $button = $(this);
          if(!$button.hasClass("blocked")) {
              var $section = $button.parent(".results-section");
              var $sectionLists = $section.find(".section-entries");
              if($sectionLists.size()>0) {
                  var index = $button.attr("data-index")*1;
                  var $listToShow = $section.find('ul[data-index="'+index+'"]');
                  if($listToShow.size()>0){
                      $listToShow.slideDown().promise().done(function(){
                          sukoaProject.updateScrollPosition($("#main-nav-wrapper"));
                          $button.attr("data-index", ++index);
                          //sukoaProject.updateScrollPosition($("#main-nav-wrapper"));
                          var $nextToShow = $section.find('ul[data-index="'+index+'"]');
                          if($nextToShow.size() === 0) {
                              $button.addClass("blocked");
                          }
                      });
                  }
              }
          }
      });

      sukoaProject.mainWrapper.on("click", "#sub-nav .switchview", function(){
          var $projectList = sukoaProject.mainWrapper.find("#sub-nav .projectList");
          if($projectList.size()>0){
              $projectList.toggleClass("completeview");
              sukoaProject.updateScrollPosition($("#main-nav-wrapper"));
          }
      });

      $(document).keypress(function(e) {
         if(e.shiftKey) {
             if(e.key === "H") {
                 sukoaProject.horizontalDisplay();
             } else if(e.key === "V") {
                 sukoaProject.verticalDisplay();
             } else if(e.key === "D") {
                 sukoaProject.diagonalDisplay();
             } else if(e.key === "W") {
                 sukoaProject.wallDisplay();
             // } else if(e.key === "M") {
             //     sukoaProject.mosaicDisplay();
             // } else if(e.key === "P") {
             //     sukoaProject.pathDisplay();
             }
         }
      });
  },

  diagonalDisplay: function() {
      var body = $('body');
      body.find('.windowItem').removeClass('displayed');
      body.find('#main-nav-wrapper').css({"z-index": 9});
      var top = sukoaProject.startingY;
      var left = sukoaProject.startingX;
      var zindex = 10;
      var spaceBetween = 77;

      var display = function($w, customPos) {
          if(!$w.hasClass('displayed')) {
              var position = customPos ? customPos : {top: top, left: left};

              $w.css({top: position.top + 'px', left: position.left + 'px', 'z-index': zindex++});
              $w.addClass('displayed');

              if(!customPos) {
                  top += spaceBetween;
                  left += spaceBetween;
              }

              return position
          }
      };


      var $projectsWindow = body.find('.windowItem.project');
      $projectsWindow.sort(function(a, b) {
          var nba = $(a).find('.project-title span.projectNo');
          var nbb = $(b).find('.project-title span.projectNo');
          if(nba.length === 0 && nbb.length === 0) {
              return 0;
          } else if(nba.length === 0) {
              return -1;
          } else if(nbb.length === 0) {
              return 1;
          } else {
              return nba.text() * 1 < nbb.text() * 1
          }
      });

      $projectsWindow.each(function() {
          var $w = $(this);
          var wPos = display($w);
          var $links = $w.find('.project-subpages a');
          if ($links.length > 0) {
              wPos.left += $w.outerWidth() + spaceBetween;
              $links.each(function() {
                  var $link = $(this);
                  var $subpage = sukoaProject.getWindowByHandle($link.attr('href'));
                  if($subpage.length > 0) {
                      display($subpage, wPos);
                      wPos.left += $subpage.outerWidth() + spaceBetween;
                  }
              })
          }
      });

      body.find('.windowItem.gallery').each(function() {
          display($(this));
      });

      body.find('.windowItem:not(.project):not(.gallery)').each(function() {
          display($(this));
      });

      sukoaProject.topZIndex = zindex;
  },

  mosaicDisplay: function() {
      var body = $('body');
      body.find('.windowItem').removeClass('displayed');
      body.find('#main-nav-wrapper').css({"z-index": 9});
      var top = sukoaProject.startingY;
      var left = sukoaProject.startingX;
      var zindex = 10;

      var wallMaxwidth = 3000;
      var maxrowHeigh = 0;
      var display = function($w) {
          if(!$w.hasClass('displayed')) {
              var position = {top: top, left: left};

              $w.css({top: position.top + 'px', left: position.left + 'px', 'z-index': zindex});
              $w.addClass('displayed');

              left += $w.outerWidth() -1;
              maxrowHeigh = $w.outerHeight() > maxrowHeigh ? $w.outerHeight() : maxrowHeigh;
              if(left > wallMaxwidth) {
                  left = sukoaProject.startingX;
                  top += maxrowHeigh - 1 ;
                  maxrowHeigh = 0;
              }

              return position
          }
      };


      var $projectsWindow = body.find('.windowItem.project');
      $projectsWindow.sort(function(a, b) {
          var nba = $(a).find('.project-title span.projectNo');
          var nbb = $(b).find('.project-title span.projectNo');
          if(nba.length === 0 && nbb.length === 0) {
              return 0;
          } else if(nba.length === 0) {
              return -1;
          } else if(nbb.length === 0) {
              return 1;
          } else {
              return nba.text() * 1 < nbb.text() * 1
          }
      });

      $projectsWindow.each(function() {
          var $w = $(this);
          var wPos = display($w);
          var $links = $w.find('.project-subpages a');
          if ($links.length > 0) {
              // wPos.left += $w.outerWidth() + spaceBetween;
              $links.each(function() {
                  var $link = $(this);
                  var $subpage = sukoaProject.getWindowByHandle($link.attr('href'));
                  if($subpage.length > 0) {
                      display($subpage);
                      // wPos.left += $subpage.outerWidth() + spaceBetween;
                  }
              })
          }
      });

      body.find('.windowItem.gallery').each(function() {
          display($(this));
      });

      body.find('.windowItem:not(.project):not(.gallery)').each(function() {
          display($(this));
      });

      sukoaProject.topZIndex = zindex;
  },

  pathDisplay: function() {
      var body = $('body');
      body.find('.windowItem').removeClass('displayed');
      body.find('#main-nav-wrapper').css({"z-index": 9});
      var top = sukoaProject.startingY;
      var left = sukoaProject.startingX;
      var zindex = 10;

      var maxLeft = 3000;
      var direction = 'right';
      var first = true;
      var down = Math.random() * 100 > 49.5;

      var display = function($w) {
          if(!$w.hasClass('displayed')) {


              if(!first) {
                  if(!down) {
                      if(direction !== 'right') {
                          var newLeft = left - $w.outerWidth() + 1;

                          if(newLeft < sukoaProject.startingX) {
                              direction = 'right';
                              down = true
                          } else {
                              left = newLeft;
                          }
                      }
                  }
              }

              var position = {top: top, left: left};

              $w.css({top: position.top + 'px', left: position.left + 'px', 'z-index': zindex});
              $w.addClass('displayed');

              if(!first) {
                  if(!down && direction === 'right') {
                      var newLeft = left + $w.outerWidth() - 1;

                      if(newLeft > maxLeft) {
                          direction = 'left';
                          down = true
                      } else {
                          left = newLeft;
                      }
                  }

                  if(down) {
                      top += $w.outerHeight() -1;
                      down = false;
                  }
              }

              first = false;
              down = Math.random() * 100 > 49.5;
              return position
          }
      };


      var $projectsWindow = body.find('.windowItem.project');
      $projectsWindow.sort(function(a, b) {
          var nba = $(a).find('.project-title span.projectNo');
          var nbb = $(b).find('.project-title span.projectNo');
          if(nba.length === 0 && nbb.length === 0) {
              return 0;
          } else if(nba.length === 0) {
              return -1;
          } else if(nbb.length === 0) {
              return 1;
          } else {
              return nba.text() * 1 < nbb.text() * 1
          }
      });

      $projectsWindow.each(function() {
          var $w = $(this);
          var wPos = display($w);
          var $links = $w.find('.project-subpages a');
          if ($links.length > 0) {
              // wPos.left += $w.outerWidth() + spaceBetween;
              $links.each(function() {
                  var $link = $(this);
                  var $subpage = sukoaProject.getWindowByHandle($link.attr('href'));
                  if($subpage.length > 0) {
                      display($subpage);
                      // wPos.left += $subpage.outerWidth() + spaceBetween;
                  }
              })
          }
      });

      body.find('.windowItem.gallery').each(function() {
          display($(this));
      });

      body.find('.windowItem:not(.project):not(.gallery)').each(function() {
          display($(this));
      });

      sukoaProject.topZIndex = zindex;
  },

  wallDisplay: function() {
      var body = $('body');
      var $allWindows = body.find('.windowItem');
      $allWindows.removeClass('displayed');
      body.find('#main-nav-wrapper').css({"z-index": 9});
      var top = sukoaProject.startingY;
      var left = sukoaProject.startingX;
      var zindex = 10;
      var spaceBetween = 77;
      var wallMaxwidth = 1500 + $allWindows.length * 50;

      wallMaxwidth = wallMaxwidth > 5000 ? 5000 : wallMaxwidth;
      var maxrowHeigh = 0;
      var display = function($w) {
          if(!$w.hasClass('displayed')) {
              var position = {top: top, left: left};

              $w.css({top: position.top + 'px', left: position.left + 'px', 'z-index': zindex});
              $w.addClass('displayed');

              left += $w.outerWidth() + spaceBetween;
              maxrowHeigh = $w.outerHeight() > maxrowHeigh ? $w.outerHeight() : maxrowHeigh;
              if(left > wallMaxwidth) {
                  left = sukoaProject.startingX;
                  top += spaceBetween + maxrowHeigh;
                  maxrowHeigh = 0;
              }

              return position
          }
      };


      var $projectsWindow = body.find('.windowItem.project');
      $projectsWindow.sort(function(a, b) {
          var nba = $(a).find('.project-title span.projectNo');
          var nbb = $(b).find('.project-title span.projectNo');
          if(nba.length === 0 && nbb.length === 0) {
              return 0;
          } else if(nba.length === 0) {
              return -1;
          } else if(nbb.length === 0) {
              return 1;
          } else {
              return nba.text() * 1 < nbb.text() * 1
          }
      });

      $projectsWindow.each(function() {
          var $w = $(this);
          var wPos = display($w);
          var $links = $w.find('.project-subpages a');
          if ($links.length > 0) {
              // wPos.left += $w.outerWidth() + spaceBetween;
              $links.each(function() {
                  var $link = $(this);
                  var $subpage = sukoaProject.getWindowByHandle($link.attr('href'));
                  if($subpage.length > 0) {
                      display($subpage);
                      // wPos.left += $subpage.outerWidth() + spaceBetween;
                  }
              })
          }
      });

      body.find('.windowItem.gallery').each(function() {
          display($(this));
      });

      body.find('.windowItem:not(.project):not(.gallery)').each(function() {
          display($(this));
      });

      sukoaProject.topZIndex = zindex;
  },

  horizontalDisplay: function() {
      var body = $('body');
      body.find('.windowItem').removeClass('displayed');
      body.find('#main-nav-wrapper').css({"z-index": 9});

      var top = sukoaProject.startingY;
      var left = sukoaProject.startingX;
      var spaceBetween = 20;
      var zindex = 10;

      var display = function($w) {
          if(!$w.hasClass('displayed')) {
              var position = {top: top, left: left};

              $w.css({top: position.top + 'px', left: position.left + 'px', 'z-index': zindex});
              $w.addClass('displayed');

              left += $w.outerWidth() + spaceBetween;

              return position
          }
      };


      var $projectsWindow = body.find('.windowItem.project');
      $projectsWindow.sort(function(a, b) {
          var nba = $(a).find('.project-title span.projectNo');
          var nbb = $(b).find('.project-title span.projectNo');
          if(nba.length === 0 && nbb.length === 0) {
              return 0;
          } else if(nba.length === 0) {
              return -1;
          } else if(nbb.length === 0) {
              return 1;
          } else {
              return nba.text() * 1 < nbb.text() * 1
          }
      });

      $projectsWindow.each(function() {
          var $w = $(this);
          display($w);
          var $links = $w.find('.project-subpages a');
          if ($links.length > 0) {
              $links.each(function() {
                  var $link = $(this);
                  var $subpage = sukoaProject.getWindowByHandle($link.attr('href'));
                  if ($subpage.length > 0) {
                      display($subpage);
                  }
              })
          }
      });

      body.find('.windowItem.gallery').each(function() {
          display($(this));
      });

      body.find('.windowItem:not(.project):not(.gallery)').each(function() {
          display($(this));
      });

      sukoaProject.topZIndex = zindex;
  },

  verticalDisplay: function() {
      var body = $('body');
      body.find('.windowItem').removeClass('displayed');
      body.find('#main-nav-wrapper').css({"z-index": 9});

      var top = sukoaProject.startingY;
      var left = sukoaProject.startingX;
      var spaceBetween = 20;
      var zindex = 10;

      var display = function($w, customPos) {
          if(!$w.hasClass('displayed')) {
              var position = customPos ? customPos : {top: top, left: left};

              $w.css({top: position.top + 'px', left: position.left + 'px', 'z-index': zindex});
              $w.addClass('displayed');

              if(!customPos) {
                  top += $w.outerHeight() + spaceBetween;
              }

              return position
          }
      };


      var $projectsWindow = body.find('.windowItem.project');
      $projectsWindow.sort(function(a, b) {
          var nba = $(a).find('.project-title span.projectNo');
          var nbb = $(b).find('.project-title span.projectNo');
          if(nba.length === 0 && nbb.length === 0) {
              return 0;
          } else if(nba.length === 0) {
              return -1;
          } else if(nbb.length === 0) {
              return 1;
          } else {
              return nba.text() * 1 < nbb.text() * 1
          }
      });

      $projectsWindow.each(function() {
          var $w = $(this);
          var wPos = display($w);
          var $links = $w.find('.project-subpages a');
          if ($links.length > 0) {
              wPos.left += $w.outerWidth() + spaceBetween;
              $links.each(function() {
                  var $link = $(this);
                  var $subpage = sukoaProject.getWindowByHandle($link.attr('href'));
                  if($subpage.length > 0) {
                      display($subpage, wPos);
                      wPos.left += $subpage.outerWidth() + spaceBetween;
                  }
              })
          }
      });

      body.find('.windowItem.gallery').each(function() {
          display($(this));
      });

      body.find('.windowItem:not(.project):not(.gallery)').each(function() {
          display($(this));
      });

      sukoaProject.topZIndex = zindex;
  },



  highlightSearchTerm: function(elem, value){
      var searchterm;
      if(typeof value !== "undefined" && value !== "") {
          searchterm= value;
      } else {
          searchterm = $("#searchTerm").attr("data-term");
      }
      if(typeof searchterm !== "undefined" && searchterm.length > 0) {
          searchterm = jQuery.trim(searchterm.toLowerCase());
          //$(".windowWrapperContent", $(".focusedWindow")).highlight(searchterm);
          elem.highlight(searchterm).promise().done(function(){
              if(elem.attr("id") === "sub-nav"){
                  var subNav = $("#sub-nav");
                  var $highlighted = subNav.find(".highlight:first");
                  if($highlighted.size()>0) {
                      var $subnav = $("#sub-nav");
                      var distance = -($subnav.offset().top - $highlighted.offset().top);
                      var $navWrapper = $("#main-nav-wrapper");
                      if(distance > $subnav.outerHeight()){
                          distance = $subnav.outerHeight() - $subnav.parent(".viewport").outerHeight();
                      } else if (distance < 0) {
                          distance = 0;
                      }
                      sukoaProject.updateScrollPosition($navWrapper, distance);
                  }
              }
          });
      }

  },


  //---------------- Form specifics ----------------//
  formInteraction: function() {
      sukoaProject.mainWrapper.on("click", "form .add-link", function(e) {
          e.preventDefault();
          e.stopPropagation();
          if(!$(this).hasClass("blocked")) {
              var $addwrapper = $(this).parent();
              var $ensembles = $addwrapper.find(".ensemble.hide");
              if($ensembles.size() > 0) {
                  $($ensembles.get(0)).removeClass("hide");
              }

              updateAddLink($addwrapper);
          }
      });

      sukoaProject.mainWrapper.on("click", "form .remove-element", function(){
          var $ensemble = $(this).closest(".ensemble");
          $ensemble.addClass("hide");
          $ensemble.find("input, textarea").each(function() {
             $(this).val("");
          });
          $ensemble.find("select").each(function(){
              $(this).val($(this).find("option:first").val());
          });

          updateAddLink($ensemble.closest(".addElement"));

      });

      function updateAddLink($addElement) {
          var $ensembles = $addElement.find(".ensemble.hide");
          if($ensembles.size() === 0) {
              $addElement.find(".add-link").addClass("blocked");
          } else {
              $addElement.find(".add-link").removeClass("blocked");
          }
      }
      sukoaProject.mainWrapper.on("keyup change", "form textarea", function() {
          var $formElem = $(this).closest(".form-element");
          var $count = $formElem.find(".count");
          if($count.size()>0) {
              var textLength = $(this).val().length;
              $formElem.find(".amount").text(textLength);
              if(textLength>$count.attr("data-max")) {
                  if (!$(this).hasClass("error")) {
                      $(this).addClass("error");
                  }
              } else {
                  if($(this).hasClass("error")) {
                      $(this).removeClass("error");
                  }
              }
          }
      });

      sukoaProject.mainWrapper.on("change", 'form input[type="file"]', function() {
          var $this = $(this);
          var $form = $this.closest("form");
          if(!sukoaProject.checkAttachementsSize($form)){
              $form.find('input[type="file"]').addClass("error");
          } else {
              $form.find('input[type="file"]').removeClass("error");
          }

          if(!sukoaProject.checkAttachmentFormat($this, $form.attr('data-allowedFileFormats'))) {
              $this.addClass('error');
          }
      });


      sukoaProject.mainWrapper.on("submit", 'form', function(e) {
          if(!sukoaProject.controlForm($(this))) {
              e.preventDefault();
          }
      });
  },


  controlForm: function(form) {
      function checkInput(f) {

          var f = jQuery(f);
          f.find('.error').removeClass('error');
          var result = true;
          var errorMessages = [];

          f.find(":text.required, input:file.required, input:radio.required, textarea.required").each(function () {
              if (jQuery(this).val().trim() === "") {
                  errorMessages = handleValidationError(this, f.attr("data-mandatoryalert"), errorMessages);
                  result = false;
              }
          });

          f.find("select.required").each(function () {
              if (jQuery(this).prop("selectedIndex") === 0) {
                  errorMessages = handleValidationError(this, f.attr("data-mandatoryalert"), errorMessages);
                  result = false;
              }
          });

          f.find(":text.email").each(function () {
              var c = jQuery(this).val().trim();
              if (c !== "" && !validateEmail(c)) {
                  errorMessages = handleValidationError(this, f.attr("data-invalidemail"), errorMessages);
                  result = false;
              }
          });


          f.find('.optiongroup').each(function(){
              if(jQuery(this).parent().hasClass("required")){
                  if ( jQuery(this).find('input:radio,input:checkbox').length>0 && jQuery(this).find('input:radio:checked,input:checkbox:checked,.custom.radio.checked').length==0  ) {
                      errorMessages = handleValidationError(this, f.attr("data-mandatoryalert"), errorMessages);
                      result = false
                  }
              }
          });


          f.find("textarea").each(function() {
              var temp = checkTextareaLength($(this));

              if(!temp) {
                  errorMessages = handleValidationError(this, f.attr("data-commentstolong"), errorMessages);
                  result = false;
              }
          });

          f.find("input[type=file]").each(function() {
             if(!sukoaProject.checkAttachmentFormat($(this), f.attr('data-allowedFileFormats'))) {
                 errorMessages = handleValidationError(this, f.attr('data-wrongFileFormat'), errorMessages);
                 result = false;
             }
          });


          if(result) {
              result = sukoaProject.checkAttachementsSize(f);
              if(!result) {
                  f.find('input[type="file"]').addClass("error");
                  alert(f.attr("data-attachementalert"));
              }
          }

          if  (errorMessages.length > 0) {
              result = false;
              var alertText = "";
              for(var i = 0; i < errorMessages.length; i++) {
                  alertText += errorMessages[i] +"\n\n";
              }
              alert(alertText);
          }

          return result;

      }

      function handleValidationError(obj, message, messages) {
          jQuery(obj).addClass("error");
          if(messages.indexOf(message) === -1) {
              messages.push(getJsDecodedString(message));
          }
          return messages;
      }

      function validateEmail(email) {
          var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          return re.test(email);
      }

      /* prevent &Uuml;mlauts, etc in js alerts.*/
      function getJsDecodedString(raw) {
          var div = document.createElement('div');
          div.innerHTML = raw;
          var decoded = div.firstChild.nodeValue;
          return decoded;
      }

      function checkTextareaLength($ta) {
          var $formELem = $ta.closest(".form-element");
          var $count = $formELem.find(".count");
          if($count.size()>0) {
              return $ta.val().length<=$count.attr("data-max")*1;
          } else {
              return true;
          }
      }

      return checkInput(form);
  },

  checkAttachementsSize : function($form) {
      var totalSize = 0;
      var allowedSize = 1024*1024*$form.attr("data-attachementsize");

      $form.find('input[type="file"]').each(function(){
          if(typeof this.files[0] !== "undefined") {
              totalSize +=  this.files[0].size;
          }
      });
      return totalSize<=allowedSize;
  },

  checkAttachmentFormat : function($fileInput, allowedFormats) {
      if(allowedFormats.length > 0) {
          if(typeof $fileInput[0].files[0] !== "undefined") {
              var format = $fileInput[0].files[0].type;

              if(format.indexOf('/') !== -1) {
                  format = format.split('/')[1];
              }

              return format.length > 0 && allowedFormats.indexOf(format) !== -1;
          }
      }
      return true;
  },

  //---------------- Sliders specifics ----------------//


  startPositionWithImageID: function(containerId, imguuid) {
      for(var i = 0; i < sukoaProject.sliders[containerId]["slides"].length; i++){
          if(sukoaProject.sliders[containerId]["slides"][i].imageuuid === imguuid){
              return i;
          }
      }
      return 0;
  },

  prepareJsonObjectForSlider: function(containerId, startIndex, isSlideshow){
      var $jsonslides = $("#"+containerId).find(".myslides");
      if(typeof startIndex === typeof undefined || startIndex === null) {
          startIndex = 1;
      }
      if($jsonslides.size()>0) {
          if(typeof sukoaProject.sliders[containerId] === typeof undefined || typeof sukoaProject.sliders[containerId] === null) {
              sukoaProject.sliders[containerId] = {"slides":{}, "myswiper":null,"template":"", "position": startIndex};
              sukoaProject.sliders[containerId]["slides"] = jQuery.parseJSON($jsonslides.text());
              if(isSlideshow) {
                  sukoaProject.sliders[containerId]["original"] = {};
                  sukoaProject.sliders[containerId]["original"] = jQuery.parseJSON($jsonslides.text());
              }

              $jsonslides.remove();

              sukoaProject.buildSlideTemplate(containerId, isSlideshow);
          }
      }

  },

  buildSlideTemplate: function(containerId, isSlideshow) {
      var slideTemplate = '<div class="swiper-slide" data-asset="{asset}" data-position="{position}" data-image="{imageuuid}"';
      if(isSlideshow){
          slideTemplate += ' data-projectid="{projectid}" data-projectname="{projectname}" data-projectlink="{projectlink}"';
      }
      slideTemplate += '>';
      if(sukoaProject.sliders[containerId]["slides"].length === 1) {
          slideTemplate += '<img class="slider-image" src="{asset}" alt="{captitcop}"/>';
          $("#"+containerId).find(".swiper-wrapper").addClass("image-wrapper").removeClass("swiper-wrapper");
      } else {
          slideTemplate += '<div class="slider-image" style="{bgasset}"></div>';
          $("#"+containerId).find(".image-wrapper").addClass("swiper-wrapper").removeClass("image-wrapper");
      }
      slideTemplate += '<div class="slider-text">{caption}{title}{copyright}</div></div>';

      sukoaProject.sliders[containerId]["template"] = slideTemplate;
  },

  buildSlidesForDefinedRange: function(containerId, startIndex, isSlideshow) {

      var hasToBeenUpdated = false;
      if(typeof sukoaProject.sliders[containerId] === typeof undefined || sukoaProject.sliders[containerId]===null) {
          sukoaProject.prepareJsonObjectForSlider(containerId, startIndex, isSlideshow);
      }

      var sliderSize = sukoaProject.sliders[containerId]["slides"].length;


      if(typeof startIndex === typeof undefined || startIndex === null || startIndex > sliderSize) {
          startIndex = 0;
      }

      sukoaProject.sliders[containerId]["position"] = startIndex+1;


      if(typeof isSlideshow === typeof undefined || isSlideshow === null) {
          isSlideshow = false;
      }


      var visibleRange = [];
      visibleRange[0] = visibleRange[1] = visibleRange[2] = -1;


      if(sliderSize === 1){
          var $sliderWrapper = $("#"+containerId+" .image-wrapper");
          var $existingSlide = $sliderWrapper.find(".swiper-slide");
          if($existingSlide.size()>0) {
              $existingSlide.remove();
          }
          $sliderWrapper.append($(sukoaProject.buildOneSlide(containerId, 0, isSlideshow)));
          visibleRange = -1;
      } else {
          var $sliderWrapper = $("#"+containerId+" .swiper-wrapper");

          //var limit = sukoaProject.nbSlidesPerSide > sliderSize ? sliderSize : sukoaProject.nbSlidesPerSide;
          var limit = sukoaProject.nbSlidesPerSide*2 > sliderSize ? sliderSize % 2 === 0 ? sliderSize / 2 : (sliderSize-1) / 2 : sukoaProject.nbSlidesPerSide;

          //build left side

          for(var il = limit; il > 0; il--){
              var indexLeft = startIndex - il;
              if(indexLeft <0) {
                  indexLeft += sliderSize;
              }
              //visibleRange[0] = indexLeft + 1;
              if(visibleRange[0] === -1){
                  visibleRange[0] = indexLeft + 1;
              }
              if(typeof sukoaProject.sliders[containerId]["slides"][indexLeft] !== "undefined") {
                  $sliderWrapper.append($(sukoaProject.buildOneSlide(containerId, indexLeft, isSlideshow)));
              }
          }

          //build right side
          visibleRange[1] = startIndex+1;
          for(var ir = 0; ir < limit+1; ir++) {
          // for(var ir = 0; ir < limit; ir++) {
              var indexRight = startIndex + ir;
              if(indexRight >= sliderSize){
                  indexRight -= sliderSize;
              }
              visibleRange[2] = indexRight+1;

              if(typeof sukoaProject.sliders[containerId]["slides"][indexRight] !== "undefined") {
                  $sliderWrapper.append($(sukoaProject.buildOneSlide(containerId, indexRight, isSlideshow)));
              }
          }
      }

      return visibleRange;

  },

  updateToLeft:function(swiper, containerId, visibleRange, isSlideshow, nbOfSlides) {
      var updatedVisibleRange = visibleRange;
      for(var i = 0; i < nbOfSlides; i++) {
          updatedVisibleRange = sukoaProject.updateToOneSide(swiper, true,containerId, visibleRange, isSlideshow);
      }
      return updatedVisibleRange
  },

  updateToRight:function(swiper, containerId, visibleRange, isSlideshow, nbOfSlides) {
      var updatedVisibleRange = visibleRange;
      for(var i = 0; i < nbOfSlides; i++) {
          updatedVisibleRange = sukoaProject.updateToOneSide(swiper, false,containerId, visibleRange, isSlideshow);
      }
      return updatedVisibleRange
  },

  updateToOneSide: function(swiper, side,containerId, visibleRange, isSlideshow) {
      visibleRange[0]--;visibleRange[1]--;visibleRange[2]--; //0 syst
      var sliderSize = sukoaProject.sliders[containerId]["slides"].length;
      var $sliderWraper =  $("#"+containerId+" .swiper-wrapper");

      if(side) {
          //slide to the left
          for(var toleft = 0; toleft < visibleRange.length; toleft++) {
              if(--visibleRange[toleft]<0){
                  visibleRange[toleft] += sliderSize;
              }
          }
          //swiper.removeSlide($sliderWraper.find(".swiper-slide").size() - 1);
          swiper.prependSlide($(sukoaProject.buildOneSlide(containerId, visibleRange[0], isSlideshow)));
          //swiper.appendSlide($(sukoaProject.buildOneSlide(containerId, visibleRange[0], isSlideshow)));
      } else {
          //slide to the right
          for(var toright = 0; toright < visibleRange.length; toright++) {
              if(++visibleRange[toright]>= sliderSize){
                  visibleRange[toright] -= sliderSize;
              }
          }
          //$sliderWraper.find(".swiper-slide:first").remove();
          //swiper.removeSlide(0);
          swiper.appendSlide($(sukoaProject.buildOneSlide(containerId, visibleRange[2], isSlideshow)));
      }
      visibleRange[0]++;visibleRange[1]++;visibleRange[2]++; //back to 1 syst
      return visibleRange;
  },


  buildOneSlide: function(containerId, i, isSlideShow) {
      if(typeof isSlideShow === typeof undefined || isSlideShow === null){
          isSlideShow = false;
      }


      var slideTemplate = sukoaProject.sliders[containerId]["template"]
          .replace("{position}", i+1)
          .replace('src="{asset}"', 'src="'+sukoaProject.sliders[containerId]["slides"][i].asset+'"')
          .replace("{asset}", sukoaProject.sliders[containerId]["slides"][i].asset)
          .replace("{imageuuid}", sukoaProject.sliders[containerId]["slides"][i].imageuuid)
          .replace("{bgasset}", "background-image: url('"+sukoaProject.sliders[containerId]["slides"][i].asset+"');")
      ;
      if(isSlideShow){
      slideTemplate = slideTemplate.replace("{projectid}", sukoaProject.sliders[containerId]["slides"][i].projectid)
              .replace("{projectname}", sukoaProject.sliders[containerId]["slides"][i].projectname)
              .replace("{projectlink}", sukoaProject.sliders[containerId]["slides"][i].projectlink)
      }

      var showedtextclass = "showed-text";

      var count = 0;
      if(sukoaProject.sliders[containerId]["slides"][i].caption !== "") {
          count++;
      }
      if(sukoaProject.sliders[containerId]["slides"][i].title !== "") {
          count++;
      }
      if(sukoaProject.sliders[containerId]["slides"][i].copyright !== "") {
          count++;
      }

      var alone = "";
      if(count === 1) {
          alone = "alone ";
      }

      var captionOrTitleOrCopyright = "";
      if(sukoaProject.sliders[containerId]["slides"][i].caption !== "") {
          slideTemplate = slideTemplate.replace("{caption}", '<p class="imglgd description '+alone+showedtextclass+'">'+sukoaProject.sliders[containerId]["slides"][i].caption+'</p>');
          showedtextclass = "hide";
          captionOrTitleOrCopyright = sukoaProject.sliders[containerId]["slides"][i].caption;
      } else {
          slideTemplate = slideTemplate.replace("{caption}", "");
      }
      if(sukoaProject.sliders[containerId]["slides"][i].title !== "") {
          slideTemplate = slideTemplate.replace("{title}", '<p class="imglgd imgtitle '+alone+showedtextclass+'">'+sukoaProject.sliders[containerId]["slides"][i].title+'</p>');
          showedtextclass = "hide";
          if(captionOrTitleOrCopyright === ""){
              captionOrTitleOrCopyright = sukoaProject.sliders[containerId]["slides"][i].title;
          }
      } else {
          slideTemplate = slideTemplate.replace("{title}", "");
      }
      if(sukoaProject.sliders[containerId]["slides"][i].copyright !== "") {
          slideTemplate = slideTemplate.replace("{copyright}", '<p class="imglgd copyrights '+alone+showedtextclass+'">'+sukoaProject.sliders[containerId]["slides"][i].copyright+'</p>');
          if(captionOrTitleOrCopyright === ""){
              captionOrTitleOrCopyright = sukoaProject.sliders[containerId]["slides"][i].copyright;
          }
      } else {
          slideTemplate = slideTemplate.replace("{copyright}", "");
      }

      slideTemplate = slideTemplate.replace('alt="{catitcop}"', 'alt="'+captionOrTitleOrCopyright+'"');


      return slideTemplate;
  },

  instanciateSlider: function(slideWindow, startIndex) {
      //var window = $("#"+slideWindow.attr("id"));
      if (typeof startIndex === typeof undefined || startIndex === null) {
          startIndex = 0;
      }
      if(typeof slideWindow !== typeof undefined  && slideWindow !== null) {
          var $swiperContainer = slideWindow;
          if (!slideWindow.hasClass("swiper-container")) {
              $swiperContainer = slideWindow.find(".swiper-container");
          }
          var isSlideshow = $swiperContainer.parent(".projectList").size()>0;

          if($swiperContainer.size() > 0) {
              $swiperContainer.each(function(){

                  var $thisContainer = $(this);
                  var positionsRange = [];
                  var containerId = $thisContainer.attr("id");
                  positionsRange = sukoaProject.buildSlidesForDefinedRange(containerId, startIndex, isSlideshow);
                  if(positionsRange === -1) {
                      $("#" + slideWindow.attr("id") + " .windowInfo").text(sukoaProject.mycustomPaginationRender(1, 1));
                  } else {

                      if(sukoaProject.sliders[containerId]["myswiper"] !== null){
                          sukoaProject.sliders[containerId]["myswiper"].removeAllSlides();
                          sukoaProject.sliders[containerId]["myswiper"].destroy();
                          delete sukoaProject.sliders[containerId]["myswiper"];
                          sukoaProject.sliders[containerId]["myswiper"] = null;

                      }
                      //if (typeof sukoaProject.sliders[containerId]["myswiper"] === "undefined" || sukoaProject.sliders[containerId]["myswiper"] === null) {
                      var sliderTimer = null;
                      sukoaProject.sliders[containerId]["myswiper"] = new Swiper("#" + containerId, {
                          loop: false,
                          effect: 'slide',
                          spaceBetween: 30,
                          pagination: "#" + slideWindow.attr("id") + " .windowInfo",
                          paginationType: "custom",
                          preloadImages: true,
                          slidesPerView: 1,
                          lazyLoading: false,
                          noSwiping: true,
                          noSwipingClass: 'swiper-slide-alone',
                          simulateTouch: false,
                          keyboardControl: false,
                          customTotal:sukoaProject.sliders[containerId]["slides"].length,
                          //customIndex: positionsRange[0],
                          customIndex: positionsRange[1]-1,
                          visibleRange: positionsRange,
                          slidesPerSide: sukoaProject.nbSlidesPerSide,
                          customReloadGap: sukoaProject.reloadSlidesGap,
                          firstTransition: true,
                          leftSide: false,
                          nbSlides: 0,
                          slidertimer : null,
                          onTransitionStart: function(swiper) {
                              if(sliderTimer !== -1 && sliderTimer !== null) {
                                  clearInterval(sliderTimer);
                                  sliderTimer = null;
                              }
                          },
                          onTransitionEnd: function (swiper) {
                              if(sukoaUtils.isMobile()) {
                                  swiper.lockSwipes();
                                  swiper.unlockSwipes();
                              } else{
                                  swiper.disableKeyboardControl();
                                  swiper.enableKeyboardControl();
                              }
                              //if(swiper.activeIndex <= this.customReloadGap || swiper.activeIndex >= this.slidesPerSide*2 - this.customReloadGap) {
                              var self = this;

                              if(sliderTimer === null) {
                                  sliderTimer = window.setInterval(function(){
                                      try {
                                          swiper.removeAllSlides();
                                          self.visibleRange = sukoaProject.buildSlidesForDefinedRange(containerId, self.customIndex - 1, isSlideshow);
                                          swiper.slideTo(self.slidesPerSide, 0, false);
                                          swiper.update(true);

                                      } catch (error){
                                          clearInterval(sliderTimer);
                                          sliderTimer = null;
                                      }
                                      clearInterval(sliderTimer);
                                      sliderTimer = null;
                                  }, 1000);

                              } else if(sliderTimer === -1) {
                                  if(swiper.activeIndex <= this.customReloadGap) {
                                      swiper.removeAllSlides();
                                      this.visibleRange = sukoaProject.buildSlidesForDefinedRange(containerId, self.customIndex - 1, isSlideshow);
                                      swiper.slideTo(self.slidesPerSide, 0, false);
                                      swiper.update(true);
                                  }
                              }

                              sukoaProject.sliders[containerId]["position"] = this.customIndex;
                              if(!sukoaUtils.isMobile()) {
                                  sukoaProject.setLinkToProjectText(slideWindow, containerId, this.customIndex-1);
                                  sukoaProject.persistWindowDetails(slideWindow);
                              }

                          },
                          onInit: function (swiper) {
                              this.slidesPerSide = sukoaProject.nbSlidesPerSide*2 > this.customTotal ? this.customTotal % 2 === 0 ? this.customTotal / 2: (this.customTotal-1)/2: sukoaProject.nbSlidesPerSide;
                              this.customReloadGap = this.slidesPerSide < sukoaProject.reloadSlidesGap ? 0 : sukoaProject.reloadSlidesGap;
                              swiper.slideTo(this.slidesPerSide, 0);
                          },
                          onSlideNextStart: function(swiper) {

                              this.customIndex = this.customIndex % this.customTotal + 1;
                              if(!sukoaUtils.isMobile()) {
                                  $(this.pagination).text(sukoaProject.mycustomPaginationRender(this.customIndex, this.customTotal));
                              }
                              this.visibleRange = sukoaProject.updateToRight(swiper, containerId, this.visibleRange, isSlideshow, 1);
                              sliderTimer = null;
                          },
                          onSlidePrevStart: function(swiper) {
                              this.customIndex = this.customIndex - 1;
                              if(this.customIndex <= 0) {
                                  this.customIndex = this.customIndex + this.customTotal;
                              }
                              if(!sukoaUtils.isMobile()) {
                                  $(this.pagination).text(sukoaProject.mycustomPaginationRender(this.customIndex, this.customTotal));
                              }
                              sliderTimer = -1;
                          },


                          onTouchEnd : function(swiper, event) {
                              if(slideWindow.css("z-index") < sukoaProject.topZIndex) {
                                  sukoaProject.setTopWindow(slideWindow);
                              }
                          }

                      });
                  }
              });

          }
      }
  },

  mycustomPaginationRender: function(index, total) {
      if(total>1){
          return index + " - " + total;
      } else {
          return "1 - 1";
      }
  },

  setLinkToProjectText: function(slideWindow, containerId, index) {

      if(slideWindow.find(".projectList").size() === 1){
          var link;
          if(typeof sukoaProject.sliders[containerId]["slides"][index].projectlink === typeof undefined) {
          } else {
              link = sukoaProject.sliders[containerId]["slides"][index].projectlink;
          }

          var name = sukoaProject.sliders[containerId]["slides"][index].projectname;
          if(link !== "undefined") {
              if(name === "undefined" ) { name = "";}
              var $windowLinkA = slideWindow.find(".windowLinks a");
              if($windowLinkA.size()>0){
                  $windowLinkA.attr("href", link);
                  $windowLinkA.attr("alt", name);
              }
              var $windowTitle = slideWindow.find(".windowMETA h1");
              var windowtitle = slideWindow.attr("data-windowtitle").split("-");
              $windowTitle.text(windowtitle[0].trim()+": " + name);
          }
      }
  },

  handleKeyboardSlideNav : function() {
      var $swiperContainer = sukoaProject.mainWrapper.find(".swiper-container");
      if($swiperContainer.size()>0){
          $swiperContainer.each(function(){
              var mySlider = $(this)[0].swiper;
              if(sukoaProject.sliders[$(this).attr("id")] && sukoaProject.sliders[$(this).attr("id")]["myswiper"] && sukoaProject.sliders[$(this).attr("id")]["myswiper"] !== null) {
              //if(typeof mySlider !== "undefined" && mySlider !== null) {
                  mySlider.disableKeyboardControl();
                  if($(this).parents(".focusedWindow").size()>0) {
                      mySlider.enableKeyboardControl();
                  }
              }
          });
      }
  },

  fullscreenSlider : function(window) {
      var $slider = window.find(".swiper-container");
      if($slider.size()>0) {
          $("body").css("overflow", "hidden");
          window.addClass("fullscreenDisplay");
          var containerid = $slider.attr("id");
          sukoaProject.instanciateSlider(window,sukoaProject.sliders[containerid]["position"]-1);
          window.on("click", ".closeFullScreen", function() {
              sukoaProject.closeFullScreenSlider(window);
          });
      }
  },

  closeFullScreenSlider: function(window) {
      window.unbind("click");
      window.find(".closeFullScreen").unbind("click");
      var $slider = window.find(".swiper-container");
      if($slider.size()>0) {
          var containerid = $slider.attr("id");
          window.removeClass("fullscreenDisplay");
          $("body").css("overflow", "visible");
          sukoaProject.instanciateSlider(window, sukoaProject.sliders[containerid]["position"]-1);
      }
  },

  //---------------- Navigation ----------------//
  checkIfSubNavEmpty: function() {
      var $subNav = $("#sub-nav");
      if($subNav.children().size() === 0) {
          $subNav.closest(".scrollNav").addClass("empty");
      } else {
          $subNav.closest(".scrollNav").removeClass("empty");
          sukoaProject.appendScrollInteractionOnSubNav();
      }
  },

  emptySubNav: function() {
      var $subNav = $("#sub-nav");
      $subNav.empty().closest(".scrollNav").addClass("empty");
  },

  appendNavigationInteraction : function(){
      var mainNavWrapper = $("#main-nav");
      var firstLevelItems = mainNavWrapper.find(".main-ul-nav>li");
      var secondLevelItems = mainNavWrapper.find(".sub-ul-nav>li>a");
      var projectList = mainNavWrapper.find("#project-list");
      var projectListLink = projectList.find(">a");
      var filters = projectList.find(".project-filters .filter");
      var slideShow = $('#slideShow');
      var searchTool = $('#search-tool');
      var searchInput = $('#search-input');
      var searchIcon = searchTool.find(".searchicon");
      projectListLink.click(function(e) {
          e.preventDefault();
          e.stopPropagation();
          sukoaProject.putNavigationOnTop();
          if(!projectList.hasClass("active")) {
              list.init();
          }
      });

      slideShow.click(function(e){
          if(!sukoaUtils.isMobile()){
              e.preventDefault();
              e.stopPropagation();
              //slideShow.toggleClass("active");
              sukoaProject.putNavigationOnTop();
              sukoaProject.loadSlider(slideShow.attr("data-href"), true);
              sukoaProject.historyUpdate(slideShow.attr("data-href"));
          }

      });

      searchTool.click(function(e){
          //e.preventDefault();
          //e.stopPropagation();
          sukoaProject.putNavigationOnTop();
          if(searchTool.hasClass("active")) {
              searchInput.val("");
              sukoaProject.historyUpdate(searchInput.attr("data-href"));
          } else {
              mainNavWrapper.find(".active").removeClass("active");
              searchTool.addClass("active");
              searchTool.addClass("focus");
              searchInput.focus();
              searchInput.val("");
              sukoaProject.loadSubNav(searchInput.attr("data-href"), true);
              sukoaProject.historyUpdate(searchInput.attr("data-href"));
          }

      });

      searchIcon.click(function(e){
          e.stopPropagation();
          e.preventDefault();
         if(searchInput.val() !== ""){
             mainNavWrapper.find(".active").removeClass("active");
             searchTool.addClass("active");
             sukoaProject.sendSearchRequest();
             $("#acs-result").find("ul").remove();
         } else {
             mainNavWrapper.find(".active").removeClass("active");
             searchTool.addClass("active");
             searchTool.addClass("focus");
             searchInput.focus();
             searchInput.val("");
             sukoaProject.loadSubNav(searchInput.attr("data-href"), true);
             sukoaProject.historyUpdate(searchInput.attr("data-href"));

         }
      });

      $("#acs-result").on("click", "li", function(e){
          //e.preventDefault();
          e.stopPropagation();
          sukoaProject.sendSearchRequest($(this).text());
          sukoaProject.putNavigationOnTop();
          $("#acs-result").find("ul").remove();
          sukoaProject.appendScrollInteractionOnProjectsFilters();
      });


      searchTool.mouseleave(function() {
          $("#main-nav").click(function(){
              sukoaProject.resetSearch();
              $("#main-nav").unbind("click");
          });
      });

      searchTool.on("keyup change", "#search-input", function(e) {
          sukoaProject.putNavigationOnTop();
          var searchInput = $("#search-input");
          var searchTerm = searchInput.val();
          if(e.keyCode === 13) {
              sukoaProject.sendSearchRequest();
              $("#acs-result").find("ul").remove();
          } else if(e.keyCode >= 37 && e.keyCode <= 40) {
              e.stopPropagation();
              e.preventDefault();
              if(e.keyCode === 40) {
                  var acsresult = $("#acs-result");
                  if(acsresult.find(".selected").size() >0) {
                      var acsli = acsresult.find("li");
                      var prevli = null;
                      acsli.each(function() {
                          if(prevli != null) {
                              $(this).addClass("selected");
                              prevli.removeClass("selected");
                              prevli = null;
                              searchInput.val($(this).text());
                          } else if($(this).hasClass("selected")) {
                             prevli = $(this);
                          }
                      });
                  } else {
                      var firstli = acsresult.find("ul li:first-child");
                      firstli.addClass("selected");
                      searchInput.val(firstli.text());
                  }

              } else if (e.keyCode == 38) {
                  var acsresult = $("#acs-result");
                  if(acsresult.find(".selected").size() >0) {
                      var acsli = acsresult.find("li");
                      var prevli = null;
                      $(acsli.get().reverse()).each(function() {
                          if(prevli != null) {
                              $(this).addClass("selected");
                              prevli.removeClass("selected");
                              prevli = null;
                              searchInput.val($(this).text());
                          } else if($(this).hasClass("selected")) {
                              prevli = $(this);
                          }
                      });
                  }
              }

          } else if(searchTerm.length >= 3) {
              var acsResult = $("#acs-result");
              acsResult.find(".overview ul").remove();
              var paramName = searchInput.attr("name");
              var url = sukoaUtils.getCurrentURL(true);
              url += "?ajaxCMD=autocomplete&"+paramName+"="+searchTerm;
              //$("#acs-result").remove();
              try {
                  $.get(url, function(data) {
                      if(data !== "") {
                          var list = $('<ul>'+data+'</ul>');
                          // acsResult.find("ul").remove();
                          acsResult.find(".overview").empty().append(list);
                          acsResult.removeClass("empty");
                      }
                      sukoaProject.appendScrollInteractionOnProjectsFilters(false);
                  });
              } catch(error) {
              }
          }
      });


      firstLevelItems.find(">.close").click(function(e) {
          var parentLi = $(this).parent();
          if(!sukoaUtils.isMobile()){
              e.preventDefault();
              if(parentLi.hasClass("active")){
                  e.stopPropagation();
                  sukoaProject.resetSearch();
                  parentLi.removeClass("active");
                  $("#sub-nav").empty();
                  $(".scrollNav").addClass("empty");
                  if(parentLi.find(".projectList").size()>0) {
                      sukoaProject.myList = null;
                  }
              }
          }
      });

      firstLevelItems.find(">a").click(function(e){
          if(!sukoaUtils.isMobile()){
              e.preventDefault();
              e.stopPropagation();
              var item = $(this).parent();
              sukoaProject.resetSearch();
              if(item.hasClass("closed")) {
                  item.removeClass("closed").addClass("active");
              }else if(!(item.hasClass("active") && item.find("#project-list").hasClass("active"))) {
                  if(item.attr("id") !== searchTool.attr("id")) {
                      searchTool.removeClass("focus");
                      var href = item.find(">a").attr("href");
                      mainNavWrapper.find(".active").removeClass("active");
                      item.addClass("active");
                      secondLevelItems.each(function() {
                          if($(this).attr("href") === href) {
                              $(this).closest("li").addClass("active");
                          }
                      });
                      sukoaProject.dispatchLoadFunctions($(this), true);

                      if(item.closest("li").find("#project-list").size()>0){
                          list.init();
                      }

                  }
              }
          }
      });



      secondLevelItems.click(function(e){
          if(!sukoaUtils.isMobile()){
              e.preventDefault();
              e.stopPropagation();
              var item = $(this);
              sukoaProject.resetSearch();
              if(!item.parent().hasClass("active") && item.attr("id") !== searchTool.attr("id")) {
                  searchTool.removeClass("focus");
                  var href = item.attr("href");
                  item.parent().parent().find(".active").removeClass("active");
                  item.parent().addClass("active");
                  sukoaProject.dispatchLoadFunctions(item, true);
              }
          }

      });

  },

  updateActiveNavLink: function(url, isNavLink) {
      if(!isNavLink && typeof url !== typeof undefined && url !== "") {
          var $mainNavWrapper = $("#main-nav");
          var $firstLevelLis = $mainNavWrapper.find(".main-ul-nav>li");
          var $secondLevelLis = $mainNavWrapper.find(".sub-ul-nav>li");

          $firstLevelLis.removeClass("active");
          $secondLevelLis.removeClass("active");

          var $firstlevelLinks = $firstLevelLis.find(">a");
          $firstlevelLinks.each(function() {
              if(url.indexOf($(this).attr("href")) !== -1) {
                  var $activeLi = $(this).closest("li");
                  $activeLi.addClass("active");
              }
          });

          var $secondlevelLinks = $secondLevelLis.find(">a");
          $secondlevelLinks.each(function(){
              if(url.indexOf($(this).attr("href")) !== -1) {
                  var $activeLi = $(this).closest("li");
                  $activeLi.addClass("active");
                  var $mainliparent = $activeLi.closest("ul").closest("li");
                  if(!$mainliparent.hasClass("active")) {
                      $mainliparent.addClass("active");
                  }
              }
          })

      }
  },

  resetSearch: function() {
      $("#acs-result").find("ul").remove();
      $("#search-input").val("");
  },

  showHideNavigation: function() {
      var $button = $("#interface-menu");
      var $navigation = $($button.attr("data-menu-open"));
      $button.click(function() {
          if($navigation.hasClass("removed")){
              sukoaProject.putNavigationOnTop();
              $navigation.removeClass("removed");
          } else {
              $navigation.addClass("removed");
          }
      });
  },

  putNavigationOnTop: function() {
      var nav = $("#main-nav-wrapper");
      if(nav.css("z-index") * 1 < sukoaProject.topZIndex) {
          sukoaProject.topZIndex++;
          nav.css("zIndex",sukoaProject.topZIndex);
          $(".focusedWindow").removeClass("focusedWindow");
          nav.find(".scrollNav").addClass("focusedWindow");
          nav.addClass("focusedWindow");
      }

      var liactive = nav.find("#main-nav").find(".main-ul-nav>li.active");
      var href = liactive.find(">a").attr("href");
      var title = liactive.find(">a").text();
      if(liactive.find("li.active").size()>0) {
          liactive = liactive.find("li.active");
          href = liactive.find(">a").attr("href");
          title = liactive.find(">a").text();
      } else if(liactive.find("#search-input").size()>0) {
          var searchInput = liactive.find("#search-input");
          href = searchInput.data("data-href");
          title = searchInput.attr("placeholder");
      }

      var secondPart = nav.find("#sub-nav").attr("data-websiteprefix");


      if(title !== "" && typeof title !== "undefined" && title !== null) {
          if( secondPart !== "" && typeof secondPart !== "undefined" && secondPart !== null) {
              document.title = title + " - " + secondPart;
          } else {
              document.title = title;
          }
      }

      sukoaProject.historyUpdate(href);
  },

  //---------------- LightBox ----------------//
  showFocus: function(elem, url) {

      if(elem.hasClass("lightbox-wrapper")) {
          var ww = elem;
      } else {
          var ww = elem.find(".lightbox-wrapper");
      }
      if(ww.size()>0) {
          var w = ww.clone();

          ww.remove();
          if(sukoaUtils.isMobile()) {
              $.fancybox.open(w, {
                  tpl : {
                    closeBtn: ''
                  },
                  helpers : {
                      overlay : {
                          //opacity: 0.7,
                          css: {'background-color' : 'rgba(119, 119, 119, 0.7)'}
                      }
                  },
                  padding: 0,
                  beforeLoad: function() {
                      if(w.hasClass("hide")) {
                          w.removeClass("hide");
                      }
                  },
                      afterLoad: function() {
                      if(typeof url !== "undefined") {
                          sukoaProject.historyUpdate(url);
                      }
                  },
                  afterShow: function() {
                      if(w.find('.swiper-container').size()>0) {
                          sukoaProject.instanciateSlider(w, 0);
                      }
                  }
              });
          } else {

              $.fancybox.open(w, {
                  tpl : {
                      closeBtn: '<a title="Close" class="fancybox-item fancybox-close" href="javascript:;">CLOSE</a>'
                  },
                  helpers : {
                      overlay : {
                          css: {"position": "absolute",'background-color' : 'rgba(119, 119, 119, 0.7)', width: "100vw", height: "100vh", "z-index": sukoaProject.topZIndex}
                      }
                  },
                  padding: 0,
                  beforeLoad: function() {
                      if(w.hasClass("hide")) {
                          w.removeClass("hide");
                      }

                  },
                  afterLoad: function() {
                      if(typeof url !== "undefined") {
                          sukoaProject.historyUpdate(url);
                      }
                      sukoaProject.topZIndex++;

                  },
                  afterShow: function() {
                      sukoaProject.mainWrapper.find(".focusedWindow").removeClass("focusedWindow");
                      if(w.find('.swiper-container').size()>0) {
                          sukoaProject.instanciateSlider(w, 0);
                      }
                      sukoaProject.highlightSearchTerm($(".lightbox-wrapper", $(".fancybox-wrap")));
                      sukoaProject.appendScrollInteraction();
                  }
              });

          }
      }
  },

  checkIsFocus: function(elem) {
      return elem.hasClass("lightbox-wrapper") || elem.find(".lightbox-wrapper").length > 0;
  },

  //---------------- Search ----------------//

  sendSearchRequest : function(text) {
      var searchInput = $("#search-input");
       if(typeof text !== "undefined") {
          searchInput.val(text);
      }
      var searchTerm = searchInput.val().replace(" - ", " ");
      var url = searchInput.attr("data-href");
      sukoaProject.historyUpdate(url+"?search="+searchTerm);
      url.replace(".html", "~areaName=branding~.html");
      url += "?search="+searchTerm;
      $.get(url, function(data) {
          var $result = $('<div>'+data+'</div>').find(".searchresult");
          if($result.size()>0){
              var $subNav = sukoaProject.mainWrapper.find("#sub-nav");
              $subNav.empty().append($result);
              sukoaProject.checkIfSubNavEmpty();
              sukoaProject.appendScrollInteractionOnSubNav()
          }
      });
  },

  //---------------- Mobile specific functions ----------------//
  handleMobileNavigation : function() {
      var $mainNav = $("#main-nav");
      sukoaProject.mainWrapper.on("click", "#interface-menu-mobile", function(){
          $mainNav.toggleClass("mobile-show");
      });

      var firstNavElts = $mainNav.find(".main-ul-nav>li");

      firstNavElts.click(function(e) {
         if(sukoaUtils.isMobile() && !$(this).hasClass("active") && $(this).find(".sub-ul-nav").size()>0){
             e.preventDefault();
             e.stopPropagation();
             $mainNav.find(".active").removeClass("active");
             $(this).addClass("active");
         }
      });

      $mainNav.on("click", ".close", function() {
          var mainLi = $(this).parent();
          if(mainLi.hasClass("active")) {
              $mainNav.find(".active").removeClass("active");
          }
      });

      sukoaProject.mainWrapper.on("click", "#sub-nav .filter", function(){
          if($(this).hasClass("active")) {
              $(this).removeClass("active");
              $(this).find(">.filter-list").slideUp();
          } else {
              $(this).addClass("active");
              $(this).find(">.filter-list").slideDown();
          }
      });

      sukoaProject.mainWrapper.on("click", "#sub-nav .filter .option", function(e) {
          e.stopPropagation();
          var url = sukoaUtils.getCurrentURL(true) + "?selectedworks=true&" + $(this).closest(".filter").attr("id").replace("-mobile", "") + "=" + $(this).attr("data-value");
          window.location.href = url;
      });
  },

  checkOrientation : function() {
      var orientation = window.matchMedia("(Orientation:landscape)");
      //var slideShow = sukoaProject.mainWrapper.find(".gallery.projectList");
      var slideShow = sukoaProject.mainWrapper.find(".gallery");
      if(slideShow.size()>0){
          var $window = slideShow.closest(".windowItem");
          if(orientation.matches) {
              sukoaProject.fullscreenSlider($window);
              $("#main-nav-wrapper").hide();
              $("#branding").hide();
          } else {
              sukoaProject.closeFullScreenSlider($window);
              $("#main-nav-wrapper").show();
              $("#branding").show();
          }
      }
  },

  appendMobileWindowInteraction : function(){
      $("body").on("click", ".lightbox-nav a", function(e) {
          e.preventDefault();
          e.stopPropagation();
          //sukoaProject.loadWindow($(this).attr("href"));
          sukoaProject.dispatchLoadFunctions($(this));
      });

      $('body').on("click", ".gallery .swiper-button", function(e){
          e.preventDefault();
          e.stopPropagation();
          var $this = $(this);
          var $window = $this.closest('.lightbox-wrapper');
          var mySwiper = $window.find(".swiper-container")[0].swiper;

          if($this.hasClass("swiper-button-next")){
              mySwiper.slideNext();
          } else {
              mySwiper.slidePrev();
          }
      });

      sukoaProject.mainWrapper.on("click", ".gallery .swiper-button", function(e){
          e.preventDefault();
          e.stopPropagation();
          var $this = $(this);
          var $window = $this.closest(".windowItem");
          var mySwiper = $window.find(".swiper-container")[0].swiper;
          if($this.hasClass("swiper-button-next")){
              mySwiper.slideNext();
          } else {
              mySwiper.slidePrev();
          }
      });

      sukoaProject.mainWrapper.on("click",".windowCloser",function(e){
          e.stopPropagation();
          var currentWindow = $(this).closest(".windowItem");
          sukoaProject.closeWindow(currentWindow);
      });

      sukoaProject.mainWrapper.on("click",".windowItem",function(e){
          var currentWindow = $(this);
          if(!currentWindow.hasClass("gallery")){
              sukoaProject.appendScrollInteraction();
          }
      });

      sukoaProject.mainWrapper.on("click", "#mob-back-btn", function(e){
          history.back();
      });

      sukoaProject.mainWrapper.on("click", ".collapsible .title", function(e) {
          //sukoaProject.appendScrollInteraction();
          var $this = $(this);
          $this.parent().toggleClass("collapsed");
      });
      $("body").on("click", ".lightbox .collapsible .title", function(e) {
          e.preventDefault();
          e.stopPropagation();
          var $this = $(this);
          $this.parent().toggleClass("collapsed")
      });

      sukoaProject.mainWrapper.on("click", ".imglgd", function(e) {
          e.stopPropagation();
          var captions = $(this).parent().find(".imglgd");
          if(captions.size()>1) {
              $(this).addClass("hide").removeClass("showed-text");
              $(captions.get((captions.index(this)+1)%captions.size())).removeClass("hide").addClass("showed-text");
          }
      });

      sukoaProject.mainWrapper.on("click", ".list-component .date-folder", function(e) {
          var $this = $(this);
          var $currentWindow = $this.closest(".windowItem");
          if($currentWindow.size() === 0) {
              $currentWindow = $("#main-nav-wrapper");
          }
          $("#"+$this.attr("data-deploy")).slideToggle(function(){
              sukoaProject.updateScrollPosition($currentWindow);
          });
          $this.toggleClass("open");
      });

      sukoaProject.mainWrapper.on("click", ".add-link", function(e) {
          e.preventDefault();
          e.stopPropagation();
          if(!$(this).hasClass("blocked")) {
              var $addwrapper = $(this).parent();
              var $ensembles = $addwrapper.find(".ensemble");
              if($ensembles.size() <= $addwrapper.attr("data-max")*1) {
                  if($ensembles.size() === 1 && $ensembles.hasClass("hide")) {
                      $ensembles.removeClass("hide");
                  } else if($ensembles.size() < $addwrapper.attr("data-max")*1) {
                      var clone = $ensembles.first().clone();
                      $addwrapper.find(".add-area").append(clone);
                  }
              }

              var $newEnsembles = $addwrapper.find(".ensemble");
              if($newEnsembles.size() === $addwrapper.attr("data-max")*1) {
                  $(this).addClass("blocked");
              }
          }
      });

      sukoaProject.mainWrapper.on("click", "#sub-nav .switchview", function(){
          var $projectList = sukoaProject.mainWrapper.find("#sub-nav .projectList");
          if($projectList.size()>0){
              $projectList.toggleClass("completeview");
          }
      });


      sukoaProject.mainWrapper.on("click", "#sub-nav .showMoreBtn", function(){
          var $button = $(this);
          if(!$button.hasClass("blocked")) {
              var $section = $button.parent(".results-section");
              var $sectionLists = $section.find(".section-entries");
              if($sectionLists.size()>0) {
                  var index = $button.attr("data-index")*1;
                  var $listToShow = $section.find('ul[data-index="'+index+'"]');
                  if($listToShow.size()>0){
                      $listToShow.slideDown().promise().done(function(){
                          sukoaProject.updateScrollPosition($("#main-nav-wrapper"));
                          $button.attr("data-index", ++index);
                          //sukoaProject.updateScrollPosition($("#main-nav-wrapper"));
                          var $nextToShow = $section.find('ul[data-index="'+index+'"]');
                          if($nextToShow.size() === 0) {
                              $button.addClass("blocked");
                          }
                      });
                  }
              }
          }
      });

  },

  dealWithSlidersOnMobile : function() {
      var $gallerywindow = sukoaProject.mainWrapper.find(".windowItem.gallery");
      if($gallerywindow.size() > 0) {
          var href = sukoaUtils.getCurrentURL(false);
          var startPosition = 0;
          var imguuid = "";
          if (href.indexOf("?") !== -1) {
              imguuid = sukoaUtils.getParameterByNameGivenURL(href,"img");
              if(imguuid !== ""){
                  var containerId = $gallerywindow.find(".swiper-container").attr("id");
                  if(typeof containerId !== typeof undefined && containerId !== null) {
                      sukoaProject.prepareJsonObjectForSlider(containerId, null, $gallerywindow.find(".gallery.projectList").size()>0);
                      startPosition = sukoaProject.startPositionWithImageID(containerId, imguuid);
                  }
              }
          }
          $gallerywindow.each(function(){
              sukoaProject.instanciateSlider($(this), startPosition);
              if($(this).find(".gallery.projectList").size()>0){
                  sukoaProject.checkOrientation();
              }
          });
      }
  },

  removeHomeLogo : function() {
      var $homelogo = $("#logo-overlay");
      if($homelogo.size()>0) {
          $homelogo.animate({"z-index":"0"}, 1500, function(){
           $homelogo.remove();
       });
      }
  },

  mobileSearch : function() {
      var $searchbtn = $('#mob-search-btn');
      var $cancelSearchbtn = $('#cancel-search');
      var $searchInput = $searchbtn.find("#mobile-search-input");
      $searchbtn.click(function(){
          if(!$searchbtn.hasClass("active")){
              $searchbtn.addClass("active");
          }
          $searchInput.focus();
      });

      $cancelSearchbtn.click(function(e) {
          e.stopPropagation();
         if($searchbtn.hasClass("active")){
             $searchbtn.removeClass("active");
         }
      });

      $searchbtn.on("keyup change", "#mobile-search-input", function(e) {
          var searchTerm = $searchInput.val();
          if(e.keyCode === 13) {
              sukoaProject.sendMobileSearchRequest();

          } else if(searchTerm.length >= 3) {
              //$("#acs-result").remove();
              var paramName = $searchInput.attr("name");
              var url = sukoaUtils.getCurrentURL(true);
              url += "?ajaxCMD=autocomplete&"+paramName+"="+searchTerm;
              try {
                  $.get(url, function(data) {
                      if(data !== "") {
                          $("#acs-mob-result").remove();
                          var list = $('<div  id="acs-mob-result"><ul>'+data+'</ul></div>');
                          $searchInput.parent().append(list);
                      }
                  });
              } catch(error) {
              }
          }
      });

      $searchbtn.on("click", "#acs-mob-result li", function(e){
          e.preventDefault();
          e.stopPropagation();
          sukoaProject.sendMobileSearchRequest($(this).text());
      });
  },

  sendMobileSearchRequest : function(text) {
      var searchInput = $("#mobile-search-input");
      if(typeof text !== "undefined") {
          searchInput.val(text);
      }
      var searchTerm = searchInput.val();
      var url = $("#search-input").attr("data-href");
      url += "?search="+searchTerm;
      window.location.href = url;
  },

  initScrollObserver: function() {
      var timeout = null;
      $(window).scroll(function () {
          if(timeout === null) {
              timeout = setTimeout(function(){
                  sukoaProject.loadImagesInRange();
                  clearTimeout(timeout);
                  timeout = null;
              }, 300);
          }
      })
  },

  //---------------- Projects index ----------------//

  initProjectsIndexWindow: function(w) {
      if(sukoaProject.projectsIndexWindows != null) {
          return;
      }

      sukoaProject.projectsIndexWindows = w;

      if (!sukoaUtils.isMobile() && !sukoaUtils.checkIsEditMode()) {
          w.find('.project').click(function(e) {
              e.stopPropagation();
              e.preventDefault();
              var $this = $(this);
              var $links = $this.find('>.links a');
              if($links.length > 0) {
                  var count = 0;
                  $links.each(function() {
                      var $link = $(this);
                      if(!$(this).hasClass('fbl')) {
                          setTimeout(function() {
                              sukoaProject.dispatchLoadFunctions($link);
                          }, count * 500);
                          count++;
                      }
                  });
              }

          });
      } else {
          sukoaProject.initScrollObserver();
      }

      var $indexWrapper = w.find('.index-wrapper');
      var $switchViewBtn = w.find('.switchview');

      var showGridView = function() {
          $indexWrapper.removeClass('list').addClass('grid');
          $switchViewBtn.removeClass('list').addClass('grid');
          sukoaProject.projectsIndexWindows.listView = false;


      };
      var showListView = function() {
          $indexWrapper.removeClass('grid').addClass('list');
          $switchViewBtn.removeClass('grid').addClass('list');
          sukoaProject.projectsIndexWindows.listView = true;
      };

      var getTopLeftProject = function() {
          $indexWrapper = w.find('.index-wrapper');
          var $projects = $indexWrapper.children('article');

          var viewportHeight, parentTop;
          if(sukoaUtils.isMobile()) {
              viewportHeight = window.innerHeight;
              parentTop = - $('#main-wrapper')[0].getBoundingClientRect().top;
          } else {
              viewportHeight = w.outerHeight();
              parentTop = w.offset().top;
          }
          for(var i = 0; i < $projects.length; i++) {
              var $proj = $($projects[i]);
              var top = $proj.offset().top;
              if(top - parentTop > -10 && top < viewportHeight + parentTop + 100) {
                  return $proj;
              }
          }

          return null;
      };



      $switchViewBtn.click(function() {
          var $topLeftProject = getTopLeftProject();
          sukoaProject.trackEvent('Projects Index', 'interaction', 'Switch grid/feed view');
          if($topLeftProject) {
              $indexWrapper.css('opacity', 0);
          }

          if (!sukoaUtils.isMobile()) {
              sukoaProject.updateScrollPosition(w, 0);
          }

          if($indexWrapper.hasClass('grid')) {
              showListView();
          } else {
              showGridView();
          }
          var newScrollPos = $topLeftProject ? Math.round($('#' + $topLeftProject.attr('id')).offset().top): 0;

          if(sukoaUtils.isMobile()) {
              $('body, html').animate({scrollTop: newScrollPos - 75}, 0);
          } else {
              sukoaProject.updateScrollPosition(w, newScrollPos - w.offset().top - 50 );
          }
          sukoaProject.loadImagesInRange();
          $indexWrapper.css('opacity', 1);
          sukoaProject.projectsIndexHistoryUpdate();
      });

      w.on('click', '.switchorder', function() {
          sukoaProject.reverseOrder(w);
          sukoaProject.trackEvent('Projects Index', 'interaction', 'Change order');
      });

      w.on('click', '.randomize', function() {
          showListView();
          $indexWrapper.children('article').shuffle();
          $indexWrapper.addClass('random');
          sukoaProject.loadImagesInRange();
          if(sukoaUtils.isMobile()) {
              $('body, html').scrollTop(0);
          } else {
              sukoaProject.updateScrollPosition(w,0);
          }
          sukoaProject.trackEvent('Projects Index', 'interaction', 'Randomize');
      });

      // load images
      var $viewport = w.find('.viewport');
      if($viewport.length > 0) {
          sukoaProject.loadImagesInRange();
      }

      if ($indexWrapper.hasClass('list')) {
          sukoaProject.projectsIndexWindows.listView = true;
      }

      if(w.find('.switchorder').hasClass('reverse')) {
          sukoaProject.projectsIndexWindows.reverseOrder = true;
      }


  },

  initProjectsIndexWindows: function($ws) {
      if($ws.length > 0) {
          $ws.each(function(){sukoaProject.initProjectsIndexWindow($(this))});
      }
  },

  projectsIndexHistoryUpdate: function() {
      var params = '';
      if(sukoaProject.projectsIndexWindows.listView) {
          params += 'list=true';
      }
      if(sukoaProject.projectsIndexWindows.reverseOrder) {
          if(params.length > 0) {
              params += '&';
          }
          params += 'reverse=true';
      }

      var url = sukoaUtils.getCurrentURL(true);
      if(params.length > 0) {
          url += '?' + params;
      }
      sukoaProject.historyUpdate(url);
  },

  reverseOrder: function(w) {
      var $indexWrapper = w.find('.index-wrapper');
      var $projects = $indexWrapper.children('article');
      var $switchorderBtn = w.find('.switchorder');
      if($indexWrapper.hasClass('random')) {
          var $orderedProjects = [];

          if($switchorderBtn.hasClass('reverse')) {
              for(var i = $projects.length - 1; i >= 0; i--) {
                  $orderedProjects.push($indexWrapper.children('#o-' + i))
              }
          } else {
              for(var i = 0; i < $projects.length; i++) {
                  $orderedProjects.push($indexWrapper.children('#o-' + i))
              }
          }
          $indexWrapper.append($orderedProjects);
          $indexWrapper.removeClass('random');
      } else {
          $indexWrapper.append($projects.get().reverse());
          $switchorderBtn.toggleClass('reverse');
      }
      if($switchorderBtn.hasClass('reverse')) {
          sukoaProject.projectsIndexWindows.reverseOrder = true;
      } else {
          sukoaProject.projectsIndexWindows.reverseOrder = false;
      }

      if(sukoaUtils.isMobile()) {
          $('body, html').animate({scrollTop: 0}, 0);
          sukoaProject.projectsIndexHistoryUpdate()
      } else {
          sukoaProject.updateScrollPosition(w,0);
      }
      sukoaProject.loadImagesInRange();
  },


  loadImagesInRange: function() {
      var $w = sukoaProject.projectsIndexWindows;
      if($w) {
          var viewportHeight = $w.outerHeight();
          var parentTop = $w.offset().top;

          if(sukoaUtils.isMobile()) {
              viewportHeight = window.innerHeight;
              parentTop = - $('#main-wrapper')[0].getBoundingClientRect().top;
          }
          var timeout = null;
          var $viewport = $w.find('.viewport');

          var loadImage = function($imgWrapper) {
              var $img = $imgWrapper.find('img');
              var src = $img.attr('data-src');
              if(src) {
                  var imgElt = document.createElement('img');
                  imgElt.onload = function() {
                      $img.attr('src', src);
                      $img.removeClass('lazy');
                      $imgWrapper.removeClass('loading');
                      $imgWrapper.css('border-color', 'transparent');
                      $w.removeClass('imgSet');
                      if (timeout) {
                          clearTimeout(timeout);
                          timeout = null;
                      }
                      timeout = setTimeout(function() {
                          $viewport.css('height', ($viewport.outerHeight() + 1) +'px');
                          setTimeout(function() {$viewport.css('height', ($viewport.outerHeight() - 1) +'px');}, 500);
                      }, 500);


                      sukoaProject.updateScrollPosition($w);
                  };
                  imgElt.src = src;
              }
          };
          var loadingImgs = $w.find('.image.loading');

          if(loadingImgs.length > 0) {

              for(var j = 0; j < loadingImgs.length; j++) {
                  var imgWrapper = $(loadingImgs[j]);
                  var top = imgWrapper.offset().top;
                  if(top - parentTop > -100 && top < viewportHeight + parentTop + 100) {
                      loadImage(imgWrapper);
                  }
              }
          }
      }

  },


};
(function($){

  $.fn.shuffle = function() {

      var allElems = this.get(),
          getRandom = function(max) {
              return Math.floor(Math.random() * max);
          },
          shuffled = $.map(allElems, function(){
              var random = getRandom(allElems.length),
                  randEl = $(allElems[random]).clone(true)[0];
              allElems.splice(random, 1);
              return randEl;
          });

      this.each(function(i){
          $(this).replaceWith($(shuffled[i]));
      });

      return $(shuffled);

  };

})(jQuery);

loadFunctions = {
  "0": sukoaProject.loadAnonymous,
  "1": sukoaProject.loadWindow,
  "2": sukoaProject.loadSubNav,
  "3": sukoaProject.loadSlider,
  "4": sukoaProject.loadVideo,
  "5": sukoaProject.loadFocus,
  "6": sukoaProject.loadProjectsIndex
};

list =  {
  timer: null,
  scrollBar: null,
  isActive: false,
  $slideshowOriginalState: null,
  init: function () {
      if(list.timer !== null) {
          clearInterval(list.timer);
      }
      var $mainNav = $("#main-nav");
      var $projectFilters = $mainNav.find(".sub-projectlist-nav");
      $projectFilters.addClass("blocked");
      if(sukoaProject.myList === null) {
          if($mainNav.find(".main-ul-nav>li.active .filter").size()>0) {
              var loop = 1;
              var initok = false;
              list.timer = window.setInterval(function () {
                  var $list = $("#sub-nav .projectList");
                  $list.hide();
                  if ($list.size() > 0 && !initok) {
                      initok = true;
                      sukoaProject.myList = list.list($list);
                  }
                  if (initok || loop === 20) {
                      clearInterval(list.timer);
                      $projectFilters.removeClass("blocked");
                  }
                  loop++;
              }, 300);
          } else {
              $projectFilters.removeClass("blocked");
          }
      } else {
          var loop = 0;
          var recup = false;
          list.timer = window.setInterval(function(){
              var $list = $(".projectList");
              $list.hide();
              if($list.size()>0) {
                  //recup = list.recuperate($list);
                  recup = list.recuperate();
              }
              if(recup || loop === 20) {
                  clearInterval(list.timer);
                  $projectFilters.removeClass("blocked");
                  $list.show();
              }
              loop++;
          }, 300);
      }

  },
  //recuperate: function($list) {
  recuperate: function() {
      //sukoaProject.myList.$list = $list;
      //sukoaProject.myList.$filter = sukoaProject.mainWrapper.find(".project-filters .filter");
      //sukoaProject.myList.$filterable = $list.find(".filterable");

      for(var entry in sukoaProject.myList.$listFeatures) {
          sukoaProject.myList.$listFeatures[entry].$domElt = $('#'+sukoaProject.myList.$listFeatures[entry].uuid);
          if(!sukoaProject.myList.$listFeatures[entry].displayed) {
              sukoaProject.myList.$listFeatures[entry].$domElt.hide();
          }
      }

      for(var filter in sukoaProject.myList.$filtersState) {
          sukoaProject.myList.$filtersState[filter].$domElt = $('#'+ sukoaProject.myList.$filtersState[filter].type);
          sukoaProject.myList.$filtersState[filter].$domElt.find("[data-value="+sukoaProject.myList.$filtersState[filter].value+"]").addClass("active");
      }

      return true;
  },

  list: function($list) {
      function List($list) {
          this.$list = $list;

          this.$filterable = this.$list.find(".filterable");
          this.$filtersState = [];
          this.$filters = sukoaProject.mainWrapper.find(".project-filters .filter");
          this.$listFeatures = [];
          var self = this;
          this.$filterable.each(function () {
              self.$listFeatures.push(list.entry($(this)));
          });
          this.$filters.each(function() {
              self.$filtersState.push(list.filter(self, $(this)));
          });

          this.$slidesShow = null;
          this.$resetButton = sukoaProject.mainWrapper.find("#filterReset");
          this.$textInput = sukoaProject.mainWrapper.find("#freeTextSearch");
          this.noFilterApplied = true;
          this.filterableNb = this.$filterable.size();
          this.hiddenNb = 0;
          this.updateSliderTimer = null;


          this.activate = function() {
              var self = this;
              this.$resetButton.click(function(e){
                  e.stopPropagation();
                  self.resetFilters();
              });

              if(!this.updateFilterFromURLParameters()){
                  this.updateFilterWithSavedState();
              }
              this.freeTextSearchListener();
          };

          this.updateSlideShow = function(speed) {
              var self = this;
              if(self.updateSliderTimer != null) {
                  clearInterval(self.updateSliderTimer);
              }
              var slideshowhref = $("#slideShow").attr("data-href");
              if (sukoaProject.windowExists(slideshowhref)) {
                  self.$slidesShow = $(".gallery.projectList .swiper-container");
                  if (self.$slidesShow.size() > 0) {
                      if(typeof speed === typeof undefinded || speed === null) {
                          speed = 1000;
                      }
                      this.updateSliderTimer = window.setInterval(function () {
                          var containerId = self.$slidesShow.attr("id");
                          sukoaProject.sliders[containerId]["slides"] = [];
                          for (var f in self.$listFeatures) {
                              if (self.$listFeatures[f].displayed && !self.$listFeatures[f].freeTextOut) {
                                  for (var s in sukoaProject.sliders[containerId]["original"]) {
                                      if (sukoaProject.sliders[containerId]["original"][s].projectid === self.$listFeatures[f].uuid) {
                                          sukoaProject.sliders[containerId]["slides"].push(sukoaProject.sliders[containerId]["original"][s]);
                                      }
                                  }

                              }
                          }
                          var $slideshow = sukoaProject.getWindowByHandle(slideshowhref);

                          if(sukoaProject.sliders[containerId]["myswiper"] !== null) {
                              sukoaProject.sliders[containerId]["myswiper"].removeAllSlides();
                          }

                          if (sukoaProject.sliders[containerId]["slides"].length > 0) {
                              sukoaProject.buildSlideTemplate(containerId, true);
                              $slideshow.find(".windowLinks").show();
                              sukoaProject.instanciateSlider($slideshow, 0);
                          } else {
                              $slideshow.find(".windowMETA h1").text($slideshow.attr("data-windowtitle").split("-")[0] + ": " + $slideshow.find(".project-slideshow").attr("data-noresult"));
                              $slideshow.find(".swiper-pagination-custom").text("");
                              $slideshow.find(".windowLinks").hide();
                              if(sukoaProject.sliders[containerId]["myswiper"] !== null) {
                                  sukoaProject.sliders[containerId]["myswiper"].destroy(true);
                                  sukoaProject.sliders[containerId]["myswiper"] = null;
                              }
                          }
                          clearInterval(self.updateSliderTimer);
                          self.updateSliderTimer = null;
                      }, speed);
                  }
              }

          };


          this.updateFilterFromURLParameters = function() {
              var updateDone = false;
              for(var f in this.$filtersState) {
                  var paramValue = sukoaUtils.getParameterByName(this.$filtersState[f].type);
                  if(paramValue !== "") {
                      self.updateFilter(this.$filtersState[f].type, paramValue, false);
                      updateDone = true;
                  }
              }
              this.$list.show();

              if(updateDone){
                  this.applyFilters();
              }
              return updateDone;

          };

          this.updateFilterWithSavedState = function() {
              var href = sukoaUtils.getCurrentURL(true)+"?ajaxCMD=getFilterState&ck="+new Date().getTime();
              $.get(href, function(data) {
                  if(data !== []) {
                      var filterArray = jQuery.parseJSON(data);
                      $.each(filterArray, function(i, obj) {
                          self.updateFilter("status", obj["status"], false);
                          self.updateFilter("location", obj["location"], false);
                          self.updateFilter("typologie", obj["typologie"], true);
                          if(obj["freeTextSearch"] !== "") {
                              self.$textInput.val(obj["freeTextSearch"]);
                              self.freeTextSearch();
                          }
                      });
                  }
                  self.$list.show();
              });
          };

          this.updateFilter = function(filterID, filterValue, apply) {
              for(var f in this.$filtersState) {
                  if(filterID === this.$filtersState[f].type) {
                      this.$filtersState[f].value = filterValue;
                      if( this.$filtersState[f].value !== "0") {
                          var $activeOption = $("[data-value="+filterValue+"]");
                          $activeOption.addClass("active");
                          this.$filtersState[f].$label.text($activeOption.find(">p").text());
                          this.$filtersState[f].$domElt.addClass("applied");
                      }
                  }
              }
              if(apply) {
                  this.applyFilters();
              }
          };

          this.updateFiltersOptions = function() {
              for (var f in this.$filtersState) {
                  if(this.$filtersState[f].$domElt.find(".level-3").size() > 0) {
                      var selectedOption = this.$filtersState[f].$domElt.find("[data-value="+this.$filtersState[f].value+"]");
                      this.$filtersState[f].updateOptions(selectedOption, true);
                  }
              }
          };

          this.applyFilters = function() {
              this.hiddenNb = 0;

              this.$textInput.val("");
              this.noFilterApplied = true;
              for (var f in this.$filtersState){
                  this.$filtersState[f].availables = "";
                  if(this.noFilterApplied && this.$filtersState[f].value !== this.$filtersState[f].defaultValue) {
                      this.noFilterApplied = false;
                  }
              }

              if(!this.noFilterApplied) {
                  this.$resetButton.addClass("reset-mode");
                  this.$resetButton.text(this.$resetButton.attr("data-resetlabel"));
              } else {
                  this.$resetButton.removeClass("reset-mode");
                  this.$resetButton.text(this.$resetButton.attr("data-label"));
              }

              for(var c in this.$listFeatures) {
                  this.$listFeatures[c].filterme(this.$filtersState, this);
              }


              this.updateFiltersOptions();
              this.persistFilterState();
              sukoaProject.appendScrollInteractionOnSubNav();
              this.checkNoResult();

          };

          this.resetFilters = function () {
              for(var f in this.$filtersState) {
                  this.$filtersState[f].resetme();
              }
              for(var d in this.$listFeatures) {
                  this.$listFeatures[d].freeTextOut = false;
              }
              sukoaProject.historyUpdate(sukoaUtils.getCurrentURL(true));
              this.applyFilters();
          };

          this.freeTextSearchListener = function() {
              this.$textInput.click(function(e){
                  e.preventDefault();
                  e.stopPropagation();
                  sukoaProject.putNavigationOnTop();
              });

              var self = this;
              $("#main-nav").on("keyup change","#freeTextSearch",function(){
                  self.$textInput.stop();
                  self.freeTextSearch();
              });
          };

          this.freeTextSearch = function() {
              this.$textInput.click(function(e){
                  e.preventDefault();
                  e.stopPropagation()
              });

              this.hiddenNb = 0;
              if(typeof freeTextSaveTimer !== "undefined") {
                  clearInterval(freeTextSaveTimer);
              }
              for(var f in this.$listFeatures) {
                  if(self.$listFeatures[f].displayed) {
                      if(this.$listFeatures[f].$domElt.find("a").text().toLowerCase().indexOf(this.$textInput.val().toLowerCase()) === -1) {
                          //this.$listFeatures[f].$domElt.hide().addClass("freetextOut");
                          this.$listFeatures[f].$domElt.hide();
                          this.$listFeatures[f].freeTextOut = true;
                          this.hiddenNb++;
                      } else {
                          this.$listFeatures[f].$domElt.show();
                          this.$listFeatures[f].freeTextOut = false;

                      }
                  }
              }

              if(this.$textInput.val().length>0) {
                  this.$resetButton.addClass("reset-mode");
                  this.$resetButton.text(this.$resetButton.attr("data-resetlabel"));
              } else if(this.noFilterApplied) {
                  this.$resetButton.removeClass("reset-mode");
                  this.$resetButton.text(this.$resetButton.attr("data-label"));
              }

              sukoaProject.appendScrollInteractionOnSubNav();
              freeTextSaveTimer =  window.setInterval(function () {
                  self.persistFilterState();
                  clearInterval(freeTextSaveTimer);
              }, 1000);

              this.checkNoResult();
          };

          this.persistFilterState = function() {
              var json = {};
              var filterParam = "";
              var paramSymbole = "?";
              for(var filter in this.$filtersState) {
                  json[this.$filtersState[filter].type] = this.$filtersState[filter].value;
                  if(this.$filtersState[filter].value !== "0"){
                      filterParam+= paramSymbole+this.$filtersState[filter].type+"="+this.$filtersState[filter].value;
                      paramSymbole = "&";
                  }
              }

              if(!sukoaUtils.isMobile() && filterParam !="") {
                  sukoaProject.historyUpdate(sukoaUtils.getCurrentURL(true)+filterParam);
              }

              json["freeTextSearch"] = $("#freeTextSearch").val();

              // var commURL = sukoaUtils.getCurrentURL(true)+"?ajaxCMD=filterSate&ck="+new Date().getTime();
              var commURL = sukoaUtils.getCurrentURL(true)+"?ajaxCMD=filterState&ck="+new Date().getTime();
              $.ajax({
                  url: commURL,
                  type: 'POST',
                  contentType: 'application/json',
                  data: JSON.stringify(json),
                  datatype:  'json'
              });
          };

           this.checkNoResult = function() {
              if (this.filterableNb <= this.hiddenNb) {
                  $("#list-noresult").removeClass("hide");
                  $list.find(".switchview").addClass("hide");
              } else {
                  $("#list-noresult").addClass("hide");
                  $list.find(".switchview").removeClass("hide");
              }
               this.updateSlideShow();
          };

          this.activate();

      }

      return new List($list)
  },

  entry : function($elem) {
      function Entry($elem) {
          this.$domElt = $elem;
          this.uuid = $elem.attr("id");
          this.status = typeof $elem.attr("data-status") !== "undefined" ? $elem.attr("data-status"):"";
          this.location = typeof $elem.attr("data-location") !== "undefined" ? $elem.attr("data-location") : "";
          this.typologie = typeof $elem.attr("data-typologie") !== "undefined" ? $elem.attr("data-typologie") : "";
          this.displayed = true;
          this.freeTextOut = false;

          this.getValueFromAttr = function(attrAsString) {
              if(attrAsString === "status") {
                  return this.status;
              } else if(attrAsString === "location") {
                  return this.location;
              } else if(attrAsString === "typologie") {
                  return this.typologie;
              }
          };

          this.displayedOrNot = function(filterState) {
              var display = true;
              for(var f in filterState) {
                  var value = this.getValueFromAttr(filterState[f].type);
                  if(filterState[f].defaultValue !== filterState[f].value) {
                      if(value.indexOf(filterState[f].value) === -1) {
                          display = false;
                          break;
                      }
                  }
              }
              return display;
          };

          this.filterme = function(filterState, list) {
              var display = this.displayedOrNot(filterState);
              var self = this;
              if(display) {
                  self.$domElt.show();
              } else {
                  self.$domElt.hide();
                  list.hiddenNb++;
              }
              this.displayed = display;
              return display;
          };
      }
      return new Entry($elem);
  },

  filter: function(list, $elem) {
      function Filter(list, $elem) {
          this.$domElt = $elem;
          this.type = $elem.attr("id");
          this.$options = $elem.find(".option");
          this.$label = $elem.find(".filter-label");
          this.$displayedfilter = $elem.find(".displayed-filter");
          this.defaultLabel = $elem.attr("data-label");
          this.value = "0";
          this.list = list;
          this.defaultValue = "0";
          this.availables = "";
          this.barsupdatedonce = false;
          this.activate = function () {
              var self = this;
              self.$domElt.click(function(e) {
                  e.preventDefault();
                  e.stopPropagation();
                  sukoaProject.putNavigationOnTop();
                  if(self.$domElt.hasClass("scrollFilter") && $(e.target).hasClass("filter-label")) {
                      self.$domElt.removeClass("scrollFilter");
                      self.destroyScrollBar();
                      self.$domElt.scrollTop(0);
                      self.resetme(true);

                  } else {
                      //self.$domElt.addClass("scrollWindow");
                      if(!self.$domElt.hasClass("scrollFilter")){
                          self.buildScrollBar();
                          self.$label.text(self.defaultLabel);
                          self.$displayedfilter.text(self.defaultLabel);
                      }
                  }


              });

              self.$options.click(function(e) {
                  e.preventDefault();
                  e.stopPropagation();
                  var newVal = $(this).attr("data-value");
                  self.$domElt.removeClass("applied");
                  self.destroyScrollBar();
                  self.$options.removeClass("active");
                  if (self.value !== newVal) {
                      if (newVal !== self.defaultValue) {
                          self.$label.text($(this).find("p").text());
                          self.$displayedfilter.text($(this).find("p").text());
                          self.$domElt.addClass("applied");
                          $(this).addClass("active");
                      } else if (newVal === self.defaultValue ) {
                          self.$label.text(self.defaultLabel);
                          self.$displayedfilter.text(self.defaultLabel);
                      }
                      self.value = newVal;
                      self.availables = "";
                      self.list.applyFilters();
                  }
              });

              var timer = null;
              self.$domElt.mouseleave(function () {
                  timer = window.setInterval(function () {
                      if(self.$domElt.hasClass("scrollFilter")) {
                          self.destroyScrollBar();
                      }
                  clearInterval(timer);
                  }, 500);
                  if(self.$domElt.hasClass("applied")){
                      self.$label.text(self.$domElt.find("[data-value="+self.value+"]").text());
                      self.$displayedfilter.text(self.$domElt.find("[data-value="+self.value+"]").text());
                  }

              });

              self.$domElt.mouseenter(function() {
                  if(timer != null) {
                      clearInterval(timer);
                  }
              });
          };

          this.buildScrollBar = function() {
              this.$domElt.addClass("scrollFilter");
              this.$domElt.find(".fix-overview").removeClass("fix-overview").addClass("overview");
              if(this.type !== "status") {
                  this.barsupdatedonce = sukoaProject.appendScrollInteractionOnProjectsFilters();
              } else {
                  this.$domElt.find(".scrollbar").addClass("disable");
              }
          };

          this.destroyScrollBar = function() {
              this.$domElt.removeClass("scrollFilter");
              //if(this.type !== "status") {
                  this.$domElt.find(".overview").removeClass("overview").addClass("fix-overview");
              //}
          };

          this.resetme = function(applyFilters) {
              this.value = this.defaultValue;
              this.$label.text(this.defaultLabel);
              this.$displayedfilter.text(this.defaultLabel);
              this.$domElt.removeClass("applied");
              this.$options.removeClass("active");
              this.barsupdatedonce = false;
              if(applyFilters) {
                  this.list.applyFilters();
              }
          };

          this.updateOptions = function(selectedOption, firstLoop) {
              var self = this;
              if(selectedOption.size()>0 && (!firstLoop || !selectedOption.hasClass("level-3"))) {
                  if(firstLoop) {
                      self.$options.hide();
                  }
                  var childs = this.$domElt.find("[data-parent="+ selectedOption.attr("data-value")+"]");
                  if(childs.size()>0) {
                      childs.show();
                      childs.each(function() {
                          self.updateOptions($(this), false);
                      });
                  }
                  selectedOption.show();
              } else {
                  this.$options.show();
              }
          };

          this.activate();
      }
      return new Filter(list, $elem);
  }
};



$(document).ready(function () {

  sukoaProject.init();
  $('#widget').draggable();
  var isMobile = sukoaUtils.isMobile();
  var isTouchD = 'ontouchstart' in window || navigator.msMaxTouchPoints;
  if (isMobile) {
      sukoaProject.mainWrapper.addClass("mobileEdition");
  }
  var $indexWindows = sukoaProject.mainWrapper.find('.projectsIndex');
  if($indexWindows.length > 0) {
      sukoaProject.initProjectsIndexWindows($indexWindows);
  }
  if(!sukoaUtils.checkIsEditMode()) {
      sukoaProject.includeAllowCookiesButton();

      if(!isMobile){
          sukoaProject.loadWindowsFromSession();
          sukoaProject.appendDragInteraction();
          sukoaProject.appendNavigationInteraction();
          sukoaProject.checkIfSubNavEmpty();
          sukoaProject.appendWindowInteraction();
          list.init();
      } else {
          sukoaProject.appendMobileWindowInteraction();
          sukoaProject.dealWithSlidersOnMobile();
          $(window).resize(function(){
              sukoaProject.checkOrientation();
          });
      }

      sukoaProject.handleMobileNavigation();
      sukoaProject.mobileSearch();
      sukoaProject.showFocus($(".lightbox-wrapper"));
      sukoaProject.formInteraction();
      sukoaProject.removerefreshparameter();
      if(window.mozInnerScreenX != null) {
          $("html").addClass("ffbw");
      }
  } else {
      var galleries = $(".gallery");
      if(galleries.size()>0) {
          galleries.each(function(){
             sukoaProject.instanciateSlider($(this));
          });
      }
  }
  if(!isMobile){
      sukoaProject.showHideNavigation();
      sukoaProject.checkIfSubNavEmpty();
      if(!isTouchD) {
          sukoaProject.appendScrollInteraction();
          sukoaProject.appendScrollInteractionOnSubNav();
      }
  }
});
