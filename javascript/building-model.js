
$(document).ready(function() {
    var eachController = function (fnc) {
      for (var controllerName in dat.controllers) {
        if (dat.controllers.hasOwnProperty(controllerName)) {
          fnc(dat.controllers[controllerName]);
        }
      }
    };

    var setID = function (v) {
      if (v) {
        this.__li.setAttribute('id', v);
      } else {
        this.__li.removeAttribute('id');
      }
      return this;
    };
    var setClass = function (v) {
      if (v) {
        this.__li.setAttribute('class', v);
      } else {
        this.__li.removeAttribute('class');
      }
      return this;
    };
    eachController(function (controller) {
      if (!controller.prototype.hasOwnProperty('id')) {
        controller.prototype.id = setID;
      }
    });
    eachController(function (controller) {
      if (!controller.prototype.hasOwnProperty('class')) {
        controller.prototype.class = setClass;
      }
    });

    function getParameterByName(name) {
      var match = new RegExp('[?&]' + name + '=([^&#/]*)').exec(window.location.search);
      return match && decodeURIComponent(match[1].replace(/\+/g, ' ')).replace('\u200E', '');
    }

    var container, scene, camera, renderer;
    var ground, foundation, building, boundingBoxes, buildingBoundingBox, halfTruss1BoundingBox, halfTruss2BoundingBox, halfTruss3BoundingBox, halfTruss4BoundingBox, roofR, roofL, roofEaveR, roofEaveL, halfTruss, logo;
    var WebbingClonesL, WebbingClonesR, FramingParent, FramingParentRoofL, FramingParentRoofR, TrussMasterR, TrussMasterL, Webbing;
    var roofColor, wallColor, trimColor, soffitColor, wainscotColor;

    var isDelete = false;
    var scaleStartX = 0;
    var scaleStartY = 0;
    var scaleStart2X = 0;
    var scaleStart2Y = 0;

    var morphStartX = 0;
    var morphStartY = 0;




    var params = {
      width: 30,
      depth: 40,
      height: 10,
      roofType: 'Gabled',
      asymmetrical: 0,
      roofPitch: 4,
      roofColor: 'Burnished Slate',
      wallColor: 'Almond',
      trimColor: 'Fern Green',
      soffitColor: 'Almond',
      wainscotColor: 'Hunter Green',
      wainscot1: false,
      wainscot2: false,
      wainscot3: false,
      wainscot4: false,
      gableFront: 0,
      gableBack: 0,
      eaveL: 0,
      eavePitchL: 2,
      eaveSoffitL: false,
      eaveR: 0,
      eavePitchR: 2,
      eaveSoffitR: false,
      halfTruss1: false,
      halfTruss1Length: 8,
      halfTruss1Depth: 6,
      halfTruss1Height: 8,
      halfTruss1Pitch: 2,
      halfTruss2: false,
      halfTruss2Length: 8,
      halfTruss2Depth: 6,
      halfTruss2Height: 8,
      halfTruss2Pitch: 2,
      halfTruss3: false,
      halfTruss3Length: 8,
      halfTruss3Depth: 6,
      halfTruss3Height: 8,
      halfTruss3Pitch: 2,
      halfTruss4: false,
      halfTruss4Length: 8,
      halfTruss4Depth: 6,
      halfTruss4Height: 8,
      halfTruss4Pitch: 2,
    };

    if (getParameterByName('load') === 'true') {

      var queryString = window.location.search;
      queryString = queryString.replace("?", '').replace("load=true&", '').split('&v=' + getParameterByName('v') + '&', 2);
      var paramsItems = queryString[0];

      paramsItems = condenseExpandParams('&' + paramsItems, true);

      var newParams = paramsItems.replace(/^&/, '').split("&").reduce(function (prev, curr, i, arr) {
        var p = curr.split("=");
        if (isNaN(parseFloat(decodeURIComponent(p[1])))) {
          var value = false;
          if (decodeURIComponent(p[1]) === 'true' || decodeURIComponent(p[1]) === 'false') {
            value = (decodeURIComponent(p[1]) === 'true');
          } else {
            value = decodeURIComponent(p[1]);
          }
          prev[decodeURIComponent(p[0])] = value;
        } else {
          prev[decodeURIComponent(p[0])] = parseFloat(decodeURIComponent(p[1]));
        }
        return prev;
      }, {});
      for (var key in newParams) {
        if (newParams.hasOwnProperty(key) && params.hasOwnProperty(key)) {
          params[key] = newParams[key];
        }
      }
    }

    var selection = null;
    var offset = new THREE.Vector3();
    var boundingBoxObjects = [];
    var raycaster = new THREE.Raycaster();

    var menu = new dat.GUI({
      autoplace: false,
      width: 300
    });

    init();
    animate();

    function init () {

      scene = new THREE.Scene();
      container = document.getElementById('building-model');
      //navBar = document.getElementsByClassName('navbar navbar-expand-lg')[0];
      //datPanel = document.getElementsByClassName('datPanel')[0];

      if (Detector.webgl) {
        renderer = new THREE.WebGLRenderer({
          canvas: container,
          antialias: true,
          preserveDrawingBuffer: true
        });
        menu.domElement.id = 'building-model';
        var datPanel = $('.dat-panel').append($('menu.domElement'));
      }

      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;


      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.name = "UserCamera";
      camera.position.set(params.width * 1.25, params.height + 0, params.depth * 1.25);
      scene.add(camera);

      window.addEventListener('resize', onResize, false);

      function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }


      //create gui folders
      var folder1 = menu.addFolder('Building Dimensions');
      var folder2 = menu.addFolder('Colors');
      var folder3 = menu.addFolder('Building Extension Options');
      var colorNames = new Array(
        "Burnished Slate",
        "Polar White",
        "Charcoal Gray",
        "Light Stone",
        "Rustic Red",
        "Koko Brown",
        "Fern Green",
        "Coal Black",
        "Harbor Blue",
        "Colonial Red",
        "Medium Bronze",
        "Pacific Blue",
        "Snow White",
        "Slate Gray",
        "Almond",
        "Midnight Bronze",
        "Everglade",
        "Brownstone",
        "Tundra",
        "Spruce",
        "Scarlet Red",
        "Hunter Green",
        "Classic Green",
        "Natural Patina",
        "Copper Metallic",
        "Silver Metallic",
        "Galvalume-Plus"
      );

      //folder 1 building dimensions
      folder1.add(params, 'width', 12, 100).step(1).name("Width (ft)").onChange(function () {
        updateBuildingSize();
      });
      folder1.add(params, 'depth', 2, 200).step(1).name("Length (ft)").onChange(function () {
        updateBuildingSize();
      });
      folder1.add(params, 'height', 6, 24).name("Height (ft)").onChange(function () {
        updateBuildingSize();
      });
      roofType = folder1.add(params, 'roofType', ['Gabled', 'Single Slope', 'Asymmetrical']).name("Roof Type").listen().onChange(function () {
        updateRoofType();
      });
      folder1.add(params, 'asymmetrical', -50, 50).step(1).name("Asymmetrical").onChange(function () {
        updateBuildingSize();
      });
      folder1.add(params, 'roofPitch', 0, 12).name('Roof Rise / 12\"').step(1).onChange(function () {
        updateBuildingSize();
      });


      //folder2 colors
      roofColor = folder2.add(params, 'roofColor', colorNames).name("Roof Color").listen().onChange(function () {
        updateColors();
      });
      wallColor = folder2.add(params, 'wallColor', colorNames).name("Wall Color").onChange(function () {
        updateColors();
      });
      trimColor = folder2.add(params, 'trimColor', colorNames).name("Trim Color").onChange(function () {
        updateColors();
      });
      soffitColor = folder2.add(params, 'soffitColor', colorNames).name("Soffit Color").onChange(function () {
        updateColors();
      });
      wainscotColor = folder2.add(params, 'wainscotColor', colorNames).name("Wainscot Color").onChange(function () {
        updateColors();
      });

      var folderWainscot = folder2.addFolder('Wainscot Walls');
      folderWainscot.add(params, 'wainscot1').name("Wainscot Front").onChange(function() {
        updateWainscot();
      });
      folderWainscot.add(params, 'wainscot3').name("Wainscot Back").onChange(function() {
        updateWainscot();
      });
      folderWainscot.add(params, 'wainscot2').name("Wainscot Left").onChange(function() {
        updateWainscot();
      });
      folderWainscot.add(params, 'wainscot4').name("Wainscot Right").onChange(function() {
        updateWainscot();
      });

      //folder 3 building extensions
      folder3.add(params, 'gableFront', 0, 5).step(1).name("Gable Front").onChange(function() {
        updateBuildingSize();
      });
      folder3.add(params, 'gableBack', 0, 5).step(1).name("Gable Back").onChange(function() {
        updateBuildingSize();
      });
      folder3.add(params, 'eaveL', 0, 14).step(1).name("Eave Left").onChange(function() {
        updateBuildingSize();
      });
      folder3.add(params, 'eavePitchL', 0, 12).name('L Pitch / 12"').step(1).onChange(function() {
        updateBuildingSize();
      });
      folder3.add(params, 'eaveR', 0, 14).step(1).name("Eave Right").onChange(function() {
        updateBuildingSize();
      });
      folder3.add(params, 'eavePitchR', 0, 12).name('R Pitch / 12"').step(1).onChange(function() {
        updateBuildingSize();
      });
      var folderhalfTruss1 = folder3.addFolder('Front Half Truss');
      folderhalfTruss1.add(params, 'halfTruss1').name("Enabled").onChange(function() {
        updateBuildingSize();
        updateWainscot();
      });
      folderhalfTruss1.add(params, 'halfTruss1Length', 2, 100).step(1).name("Length").onChange(function() {
        updateBuildingSize();
      });
      folderhalfTruss1.add(params, 'halfTruss1Depth', 2, 20).step(1).name("Depth").onChange(function() {
        updateBuildingSize();
      });
      folderhalfTruss1.add(params, 'halfTruss1Height', 6, 24).step(1).name("Height").onChange(function() {
        updateBuildingSize();
      });
      folderhalfTruss1.add(params, 'halfTruss1Pitch', 0, 12).step(1).name("Roof Pitch").onChange(function() {
        updateBuildingSize();
      });
      var folderhalfTruss2 = folder3.addFolder('Left Half Truss');
      folderhalfTruss2.add(params, 'halfTruss2').name("Enabled").onChange(function() {
        updateBuildingSize();
        updateWainscot();
      });
      folderhalfTruss2.add(params, 'halfTruss2Depth', 2, 50).step(1).name("Width").onChange(function() {
        updateBuildingSize();
      });
      folderhalfTruss2.add(params, 'halfTruss2Pitch', 0, 12).step(1).name("Roof Pitch").onChange(function() {
        updateBuildingSize();
      });
      var folderhalfTruss3 = folder3.addFolder('Back Half Truss');
      folderhalfTruss3.add(params, 'halfTruss3').name("Enabled").onChange(function() {
        updateBuildingSize();
        updateWainscot();
      });
      folderhalfTruss3.add(params, 'halfTruss3Length', 2, 100).step(1).name("Length").onChange(function() {
        updateBuildingSize();
      });
      folderhalfTruss3.add(params, 'halfTruss3Depth', 2, 20).step(1).name("Depth").onChange(function() {
        updateBuildingSize();
      });
      folderhalfTruss3.add(params, 'halfTruss3Height', 6, 24).step(1).name("Height").onChange(function() {
        updateBuildingSize();
      });
      folderhalfTruss3.add(params, 'halfTruss3Pitch', 0, 12).step(1).name("Roof Pitch").onChange(function() {
        updateBuildingSize();
      });
      var folderhalfTruss4 = folder3.addFolder('Right Half Truss');
      folderhalfTruss4.add(params, 'halfTruss4').name("Enabled").onChange(function() {
        updateBuildingSize();
        updateWainscot();
      });
      folderhalfTruss4.add(params, 'halfTruss4Depth', 2, 50).step(1).name("Width").onChange(function() {
        updateBuildingSize();
      });
      folderhalfTruss4.add(params, 'halfTruss4Pitch', 0, 12).step(1).name("Roof Pitch").onChange(function() {
        updateBuildingSize();
      });
      folder1.open();
      menu.open();
      //end gui menu setup


      //immediately executed function, needs wrapped in parens
      (function () {
        //add lighting
        var light = new THREE.HemisphereLight(0xffe5bb, 0xFFBF00, 0.2);
        light.color.setHex(0xffffff);
        light.groundColor.setHex(0xffffff);
        light.name = "HemisphereLight";
        scene.add(light);

        light = new THREE.DirectionalLight('white', 0.5);
        light.name = "FrontDirectionalLight";
        light.position.set(60, 75, 120);
        light.target.position.set(0, 0, 0);
        light.castShadow = true;
        light.shadow.mapSize.width = 4096;
        light.shadow.mapSize.height = 4096;
        light.shadow.camera.right = 110;
        light.shadow.camera.left = -110;
        light.shadow.camera.top = 110;
        light.shadow.camera.bottom = -110;
        light.shadow.camera.near = 25;
        light.shadow.camera.far = 300;
        light.shadow.camera.visible = true;
        light.shadow.bias = -0.0005;
        scene.add(light);

        light = new THREE.DirectionalLight('white', 0.25);
        light.name = "BackDirectionalLight";
        light.position.set(-30, 75, -150);
        light.target.position.set(0, 0, 0);
        scene.add(light);

        light = new THREE.DirectionalLight('white', 0.25);
        light.name = "FillDirectionalLight";
        light.position.set(-50, -150, -50);
        light.target.position.set(0, 0, 0);
        scene.add(light);

        light = new THREE.PointLight('white', 0.5);
        light.name = "PointLight";
        light.position.set(-20, 40, 20);
        scene.add(light);
      })();
      // end lights

      //add fog
      scene.fog = new THREE.Fog(0xbcd3db, 10, 250);
      //end fog

      // add sky
      var skyGeo = new THREE.SphereGeometry(500, 25, 25);
      var textureUrl = 'public/sky-sq.jpg';
      var loader = new THREE.TextureLoader();
      var texture = loader.load(textureUrl);
      var material = new THREE.MeshBasicMaterial({
        name: "skySphere-Material",
        map: texture,
        fog: false,
      });
      var sky = new THREE.Mesh(skyGeo, material);
      sky.material.side = THREE.BackSide;
      sky.name = "skySphere-Mesh";
      scene.add(sky);

      //add grass
      textureUrl = 'public/grass.jpg';
      loader = new THREE.TextureLoader();
      loader.crossOrigin = "anonymous";
      texture = loader.load(textureUrl);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.x = 200;
      texture.repeat.y = 200;
      texture.anisotropy = renderer.getMaxAnisotropy();
      texture.anisotropy = 5;
      var geometry = new THREE.CircleGeometry(1000, 24);
      material = new THREE.MeshPhongMaterial({
        name: "grassGroundPlane-Material",
        map: texture,
        bumpMap: texture,
        bumpScale: 0.1,
        shininess: 1,
      });
      var object3d = new THREE.Mesh(geometry, material);
      object3d.rotateX(-Math.PI / 2);
      object3d.name = "ground";
      object3d.castShadow = false;
      object3d.receiveShadow = true;
      ground = object3d;
      scene.add(object3d);
      //end grass


      // add foundation
      geometry = new THREE.BoxGeometry(1, 0.05, 1);
      textureUrl = 'public/concrete.jpg';
      loader = new THREE.TextureLoader();
      loader.crossOrigin = "anonymous";
      texture = loader.load(textureUrl);
      texture.anisotropy = renderer.getMaxAnisotropy();
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      material = new THREE.MeshPhongMaterial({
        color: 'white',
        name: "foundation-Material",
        map: texture,
        bumpMap: texture,
        bumpScale: 0.04,
        specularMap: texture
      });
      foundation = new THREE.Mesh(geometry, material);
      foundation.name = "foundation";
      foundation.castShadow = true;
      foundation.receiveShadow = true;
      scene.add(foundation);
      updateFoundation();
      //end foundation


      //make building
      geometry = new THREE.BoxGeometry(1, 1, 1);
      geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0.5, 0));
      material = new THREE.MeshPhongMaterial({
        color: 0xffe5bb,
        wireframe: true,
        side: THREE.DoubleSide,
        visible: false
      });
      boundingBoxes = new THREE.Mesh(geometry, material);
      boundingBoxes.name = "boundingBoxes";
      scene.add(boundingBoxes);
      geometry = new THREE.BoxGeometry(1, 1, 1);
      geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0.5, 0));
      material = new THREE.MeshPhongMaterial({
        color: 0xffe5bb,
        wireframe: true,
        side: THREE.DoubleSide,
        visible: false
      });

      buildingBoundingBox = new THREE.Mesh(geometry, material);
      buildingBoundingBox.name = "buildingBoundingBox";
      boundingBoxObjects.push(buildingBoundingBox);
      boundingBoxes.add(buildingBoundingBox);
      geometry = new THREE.BoxGeometry(1, 1, 1);
      geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0.5, 0.5));
      material = new THREE.MeshPhongMaterial({
        color: 0xffe5bb,
        wireframe: true,
        side: THREE.DoubleSide,
        visible: false
      });

      var halfTruss1BoundingBox = new THREE.Mesh(geometry,material);
      halfTruss1BoundingBox.name = "halfTruss1BoundingBox";
      halfTruss1BoundingBox.rotation.y = 0;
      boundingBoxObjects.push(halfTruss1BoundingBox);
      boundingBoxes.add(halfTruss1BoundingBox);
      geometry = new THREE.BoxGeometry(1,1,1);
      geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0.5, 0.5));
      material = new THREE.MeshPhongMaterial({
        color: 0xffe5bb,
        wireframe: true,
        side: THREE.DoubleSide,
        visible: false
      });

      var halfTruss2BoundingBox = new THREE.Mesh(geometry,material);
      halfTruss2BoundingBox.name = "halfTruss2BoundingBox";
      halfTruss2BoundingBox.rotation.y = Math.PI / -2;
      boundingBoxObjects.push(halfTruss2BoundingBox);
      boundingBoxes.add(halfTruss2BoundingBox);
      geometry = new THREE.BoxGeometry(1,1,1);
      geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0.5, 0.5));
      material = new THREE.MeshPhongMaterial({
        color: 0xffe5bb,
        wireframe: true,
        side: THREE.DoubleSide,
        visible: false
      });

      var halfTruss3BoundingBox = new THREE.Mesh(geometry,material);
      halfTruss3BoundingBox.name = "halfTruss3BoundingBox";
      halfTruss3BoundingBox.rotation.y = Math.PI;
      boundingBoxObjects.push(halfTruss3BoundingBox);
      boundingBoxes.add(halfTruss3BoundingBox);
      geometry = new THREE.BoxGeometry(1,1,1);
      geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0.5, 0.5));
      material = new THREE.MeshPhongMaterial({
        color: 0xffe5bb,
        wireframe: true,
        side: THREE.DoubleSide,
        visible: false
      });

      var halfTruss4BoundingBox = new THREE.Mesh(geometry,material);
      halfTruss4BoundingBox.name = "halfTruss4BoundingBox";
      halfTruss4BoundingBox.rotation.y = Math.PI / 2;
      boundingBoxObjects.push(halfTruss4BoundingBox);
      boundingBoxes.add(halfTruss4BoundingBox);


      loader = new THREE.JSONLoader();
      loader.crossOrigin = "anonymous";
      loader.load('public/Building.json', function (geometry, materials) {

        material = new THREE.MultiMaterial(materials);
        textureUrl = 'public/building-normal.jpg';
        loader = new THREE.TextureLoader();
        var textureWidth = loader.load(textureUrl, function () {
          textureWidth.anisotropy = Math.min(renderer.getMaxAnisotropy(), 5);
          textureWidth.wrapS = THREE.RepeatWrapping;
          textureWidth.wrapT = THREE.RepeatWrapping;
        });
        var textureWidthLeft = loader.load(textureUrl, function () {
          textureWidthLeft.anisotropy = Math.min(renderer.getMaxAnisotropy(), 5);
          textureWidthLeft.wrapS = THREE.RepeatWrapping;
          textureWidthLeft.wrapT = THREE.RepeatWrapping;
        });
        var textureWidthRight = loader.load(textureUrl, function () {
          textureWidthRight.anisotropy = Math.min(renderer.getMaxAnisotropy(), 5);
          textureWidthRight.wrapS = THREE.RepeatWrapping;
          textureWidthRight.wrapT = THREE.RepeatWrapping;
        });
        var textureDepth = loader.load(textureUrl, function () {
          textureDepth.anisotropy = Math.min(renderer.getMaxAnisotropy(), 5);
          textureDepth.wrapS = THREE.RepeatWrapping;
          textureDepth.wrapT = THREE.RepeatWrapping;
        });
        var textureHalfTruss1Width = loader.load(textureUrl, function() {
          textureHalfTruss1Width.anisotropy = Math.min(renderer.getMaxAnisotropy(), 5);
          textureHalfTruss1Width.wrapS = THREE.RepeatWrapping;
          textureHalfTruss1Width.wrapT = THREE.RepeatWrapping;
        });
        var textureHalfTruss1Depth = loader.load(textureUrl, function() {
          textureHalfTruss1Depth.anisotropy = Math.min(renderer.getMaxAnisotropy(), 5);
          textureHalfTruss1Depth.wrapS = THREE.RepeatWrapping;
          textureHalfTruss1Depth.wrapT = THREE.RepeatWrapping;
        });
        var textureHalfTruss2Width = loader.load(textureUrl, function() {
          textureHalfTruss2Width.anisotropy = Math.min(renderer.getMaxAnisotropy(), 5);
          textureHalfTruss2Width.wrapS = THREE.RepeatWrapping;
          textureHalfTruss2Width.wrapT = THREE.RepeatWrapping;
        });
        var textureHalfTruss2Depth = loader.load(textureUrl, function() {
          textureHalfTruss2Depth.anisotropy = Math.min(renderer.getMaxAnisotropy(), 5);
          textureHalfTruss2Depth.wrapS = THREE.RepeatWrapping;
          textureHalfTruss2Depth.wrapT = THREE.RepeatWrapping;
        });
        var textureHalfTruss3Width = loader.load(textureUrl, function() {
          textureHalfTruss3Width.anisotropy = Math.min(renderer.getMaxAnisotropy(), 5);
          textureHalfTruss3Width.wrapS = THREE.RepeatWrapping;
          textureHalfTruss3Width.wrapT = THREE.RepeatWrapping;
        });
        var textureHalfTruss3Depth = loader.load(textureUrl, function() {
          textureHalfTruss3Depth.anisotropy = Math.min(renderer.getMaxAnisotropy(), 5);
          textureHalfTruss3Depth.wrapS = THREE.RepeatWrapping;
          textureHalfTruss3Depth.wrapT = THREE.RepeatWrapping;
        });
        var textureHalfTruss4Width = loader.load(textureUrl, function() {
          textureHalfTruss4Width.anisotropy = Math.min(renderer.getMaxAnisotropy(), 5);
          textureHalfTruss4Width.wrapS = THREE.RepeatWrapping;
          textureHalfTruss4Width.wrapT = THREE.RepeatWrapping;
        });
        var textureHalfTruss4Depth = loader.load(textureUrl, function() {
          textureHalfTruss4Depth.anisotropy = Math.min(renderer.getMaxAnisotropy(), 5);
          textureHalfTruss4Depth.wrapS = THREE.RepeatWrapping;
          textureHalfTruss4Depth.wrapT = THREE.RepeatWrapping;
        });

        for (var m = 0; m < materials.length; m++) {
          materials[m].morphTargets = true;
          materials[m].side = THREE.DoubleSide;
          materials[m].castShadow = true;
          materials[m].receiveShadow = true;
          if (materials[m].name === 'BuildingWainscot1' || materials[m].name === 'BuildingWainscot3') {
            materials[m].normalMap = textureWidth;
          }
          if (materials[m].name === 'BuildingWallsWidthLeftFront' || materials[m].name === 'BuildingWallsWidthLeftBack' || materials[m].name === 'BuildingWallsWidthLeftFront-Interior' || materials[m].name === 'BuildingWallsWidthLeftBack-Interior') {
            materials[m].normalMap = textureWidthLeft;
          }
          if (materials[m].name === 'BuildingWallsWidthRightFront' || materials[m].name === 'BuildingWallsWidthRightBack' || materials[m].name === 'BuildingWallsWidthRightFront-Interior' || materials[m].name === 'BuildingWallsWidthRightBack-Interior') {
            materials[m].normalMap = textureWidthRight;
          }
          if (materials[m].name === 'BuildingWallsDepthL' || materials[m].name === 'BuildingWallsDepthR' || materials[m].name === 'BuildingWallsDepthL-Interior' || materials[m].name === 'BuildingWallsDepthR-Interior' || materials[m].name === 'BuildingCeilingLeft-Interior' || materials[m].name === 'BuildingCeilingRight-Interior' || materials[m].name === 'BuildingWainscot2' || materials[m].name === 'BuildingWainscot4') {
            materials[m].normalMap = textureDepth;
          }
          if (materials[m].name === 'BuildingWallsDepthL-Interior' || materials[m].name === 'BuildingWallsDepthR-Interior' || materials[m].name === 'BuildingWallsWidth-Interior' || materials[m].name === 'BuildingWallsWidthRightFront-Interior' || materials[m].name === 'BuildingWallsWidthRightBack-Interior' || materials[m].name === 'BuildingWallsWidthLeftFront-Interior' || materials[m].name === 'BuildingWallsWidthLeftBack-Interior') {
            materials[m].emissive.setHex(0x555555);
          }
          if (materials[m].name === 'BuildingCeilingLeft-Interior' || materials[m].name === 'BuildingCeilingRight-Interior') {
            materials[m].emissive.setHex(0x333333);
          }
        }

        building = new THREE.Mesh(geometry, material);
        building.name = "building";
        building.rotation.x = Math.PI / -2;
        building.material.side = THREE.DoubleSide;
        building.castShadow = true;
        building.receiveShadow = true;
        building.morphTargets = true;
        building.frustumCulled = false;
        building.normalsNeedUpdate = true;
        building.verticesNeedUpdate = true;
        scene.add(building);
        //end building mesh

        // var loader = new THREE.JSONLoader();
        // loader.load('Logo.json', function (geometry, materials) {
          // var material = new THREE.MultiMaterial(materials);
          // logo = new THREE.Mesh(geometry, material);
          // logo.name = "logo";
          // logo.castShadow = true;
          // logo.receiveShadow = true;
          // scene.add(logo);

          // make roof
        var loader = new THREE.JSONLoader();
        loader.crossOrigin = "anonymous";
          loader.load('public/Roof.json', function (geometry, materials) {
            var material = new THREE.MultiMaterial(materials);
            var textureUrl = 'public/building-normal.jpg';
            var loader = new THREE.TextureLoader();
            var texture = loader.load(textureUrl);
            texture.anisotropy = Math.min(renderer.getMaxAnisotropy(), 5);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            for (var m = 0; m < materials.length; m++) {
              materials[m].morphTargets = true;
              materials[m].side = 3;
              if (materials[m].name === 'BuildingRoof') {
                materials[m].normalMap = texture;
              }
              if (materials[m].name === 'BuildingSoffit') {
                materials[m].normalMap = texture;
              }
              if (materials[m].name === 'BuildingTrim-RoofPivot') {
                materials[m].transparent = true;
                materials[m].opacity = 0;
              }
            }

            roofR = new THREE.Mesh(geometry, material);
            roofR.name = "roofR";
            roofR.rotation.x = Math.PI / -2;
            roofR.material.side = THREE.DoubleSide;
            roofR.castShadow = true;
            roofR.receiveShadow = true;
            roofR.morphTargets = true;
            roofR.frustumCulled = false;
            scene.add(roofR);

            roofEaveR = new THREE.Mesh(geometry,material);
            roofEaveR.name = "roofEaveR";
            roofEaveR.rotation.x = Math.PI / -2;
            roofEaveR.material.side = THREE.DoubleSide;
            roofEaveR.castShadow = true;
            roofEaveR.receiveShadow = true;
            roofEaveR.morphTargets = true;
            roofEaveR.frustumCulled = false;
            scene.add(roofEaveR);

            roofL = new THREE.Mesh(geometry, material);
            roofL.name = "roofL";
            roofL.rotation.x = Math.PI / -2;
            roofL.rotation.z = Math.PI / -1;
            roofL.material.side = THREE.DoubleSide;
            roofL.castShadow = true;
            roofL.receiveShadow = true;
            roofL.morphTargets = true;
            roofL.frustumCulled = false;
            scene.add(roofL);

            roofEaveL = new THREE.Mesh(geometry,material);
            roofEaveL.name = "roofEaveL";
            roofEaveL.rotation.x = Math.PI / -2;
            roofEaveL.rotation.z = Math.PI / -1;
            roofEaveL.material.side = THREE.DoubleSide;
            roofEaveL.castShadow = true;
            roofEaveL.receiveShadow = true;
            roofEaveL.morphTargets = true;
            roofEaveL.frustumCulled = false;
            scene.add(roofEaveL);

            var TrussMasterL = new THREE.Group();
            TrussMasterL.name = "TrussMasterL";
            scene.add(TrussMasterL);
            loader = new THREE.JSONLoader();
            loader.crossOrigin = "anonymous";
            loader.load('public/Truss.json', function(geometry, materials) {
              var mirrorGap = 0.02;
              var material = new THREE.MultiMaterial(materials);
              TrussWallOuter = new THREE.Mesh(geometry,material);
              TrussWallOuter.name = "TrussWallOuter";
              TrussWallOuter.rotation.x = Math.PI / -2;
              TrussWallOuter.position.set(0, 0.01, mirrorGap);
              TrussMasterL.add(TrussWallOuter);
              TrussWallOuter2 = new THREE.Mesh(geometry,material);
              TrussWallOuter2.name = "TrussWallOuter";
              TrussWallOuter2.rotation.x = Math.PI / -2;
              TrussWallOuter2.rotation.z = Math.PI / 2;
              TrussWallOuter2.position.set(0, 0.01, -mirrorGap);
              TrussMasterL.add(TrussWallOuter2);
              var TrussBase = new THREE.Mesh(geometry,material);
              TrussBase.name = "TrussBase";
              TrussBase.rotation.set(Math.PI / -2, Math.PI / -2, 0);
              TrussBase.position.set(0.66, 0.025, 0);
              TrussBase.scale.z = 0.66;
              TrussMasterL.add(TrussBase);
              var TrussBase2 = new THREE.Mesh(geometry,material);
              TrussBase2.name = "TrussBase";
              TrussBase2.rotation.set(Math.PI / -2, Math.PI / -2, Math.PI / 2);
              TrussBase2.position.set(0.66, 0.025, 0);
              TrussBase2.scale.z = 0.66;
              TrussMasterL.add(TrussBase2);
              var TrussWallInner = new THREE.Mesh(geometry,material);
              TrussWallInner.name = "TrussWallInner";
              TrussWallInner.rotation.set(Math.PI / -2, 0, Math.PI / -2);
              TrussWallInner.position.set(0.66, 0.01, mirrorGap);
              TrussMasterL.add(TrussWallInner);
              var TrussWallInner2 = new THREE.Mesh(geometry,material);
              TrussWallInner2.name = "TrussWallInner";
              TrussWallInner2.rotation.set(Math.PI / -2, 0, Math.PI);
              TrussWallInner2.position.set(0.66, 0.01, -mirrorGap);
              TrussMasterL.add(TrussWallInner2);
              var TrussTangent = new THREE.Group();
              TrussTangent.name = "TrussTangent";
              TrussTangent.position.set(0, params.height, 0);
              TrussMasterL.add(TrussTangent);
              var TrussTangentUpper = new THREE.Mesh(geometry,material);
              TrussTangentUpper.name = "TrussTangentUpper";
              TrussTangentUpper.rotation.set(Math.PI / -2, Math.PI / 2, Math.PI / -2);
              TrussTangentUpper.position.set(0, 0, 0);
              TrussTangent.add(TrussTangentUpper);
              var TrussTangentLower = new THREE.Mesh(geometry,material);
              TrussTangentLower.name = "TrussTangentLower";
              TrussTangentLower.rotation.set(Math.PI / -2, Math.PI / 2, 0);
              TrussTangentLower.position.set(0, 0, 0);
              TrussTangent.add(TrussTangentLower);
              var TrussTangentUpper2 = new THREE.Mesh(geometry,material);
              TrussTangentUpper2.name = "TrussTangentUpper";
              TrussTangentUpper2.rotation.set(Math.PI / -2, Math.PI / 2, Math.PI);
              TrussTangentUpper2.position.set(0, 0, 0);
              TrussTangent.add(TrussTangentUpper2);
              var TrussTangentLower2 = new THREE.Mesh(geometry,material);
              TrussTangentLower2.name = "TrussTangentLower";
              TrussTangentLower2.rotation.set(Math.PI / -2, Math.PI / 2, Math.PI / 2);
              TrussTangentLower2.position.set(0, 0, 0);
              TrussTangent.add(TrussTangentLower2);
              TrussKeystone = new THREE.Mesh(geometry,material);
              TrussKeystone.name = "TrussKeystone";
              TrussKeystone.rotation.set(Math.PI / -2, Math.PI, 0);
              TrussKeystone.position.set(6, params.height, 0);
              TrussMasterL.add(TrussKeystone);
              TrussKeystone2 = new THREE.Mesh(geometry,material);
              TrussKeystone2.name = "TrussKeystone";
              TrussKeystone2.rotation.set(Math.PI / -2, Math.PI, Math.PI / 2);
              TrussKeystone2.position.set(6, params.height, 0);
              TrussMasterL.add(TrussKeystone2);
              TrussMasterR = scene.getObjectByName('TrussMasterL').clone();
              TrussMasterR.name = "TrussMasterR";
              TrussMasterR.rotation.y = Math.PI;
              scene.add(TrussMasterR);
              TrussRoofOuter = new THREE.Mesh(geometry,material);
              TrussRoofOuter.name = "TrussRoofOuter";
              TrussRoofOuter.rotation.set(Math.PI / -2, Math.PI / 2, 0);
              TrussRoofOuter.position.set(0, params.height, mirrorGap);
              TrussMasterL.add(TrussRoofOuter);
              TrussRoofOuter2 = new THREE.Mesh(geometry,material);
              TrussRoofOuter2.name = "TrussRoofOuter";
              TrussRoofOuter2.rotation.set(Math.PI / -2, Math.PI / 2, Math.PI / 2);
              TrussRoofOuter2.position.set(0, params.height, -mirrorGap);
              TrussMasterL.add(TrussRoofOuter2);
              TrussRoofInner = new THREE.Mesh(geometry,material);
              TrussRoofInner.name = "TrussRoofInner";
              TrussRoofInner.rotation.set(Math.PI / -2, Math.PI / 2, Math.PI / -2);
              TrussRoofInner.position.set(1, params.height - 1, mirrorGap);
              TrussMasterL.add(TrussRoofInner);
              TrussRoofInner2 = new THREE.Mesh(geometry,material);
              TrussRoofInner2.name = "TrussRoofInner";
              TrussRoofInner2.rotation.set(Math.PI / -2, Math.PI / 2, Math.PI);
              TrussRoofInner2.position.set(1, params.height - 1, -mirrorGap);
              TrussMasterL.add(TrussRoofInner2);
              TrussRoofOuter = new THREE.Mesh(geometry,material);
              TrussRoofOuter.name = "TrussRoofOuter";
              TrussRoofOuter.rotation.set(Math.PI / -2, Math.PI / 2, 0);
              TrussRoofOuter.position.set(0, params.height, mirrorGap);
              TrussMasterR.add(TrussRoofOuter);
              TrussRoofOuter2 = new THREE.Mesh(geometry,material);
              TrussRoofOuter2.name = "TrussRoofOuter";
              TrussRoofOuter2.rotation.set(Math.PI / -2, Math.PI / 2, Math.PI / 2);
              TrussRoofOuter2.position.set(0, params.height, -mirrorGap);
              TrussMasterR.add(TrussRoofOuter2);
              TrussRoofInner = new THREE.Mesh(geometry,material);
              TrussRoofInner.name = "TrussRoofInner";
              TrussRoofInner.rotation.set(Math.PI / -2, Math.PI / 2, Math.PI / -2);
              TrussRoofInner.position.set(1, params.height - 1, mirrorGap);
              TrussMasterR.add(TrussRoofInner);
              TrussRoofInner2 = new THREE.Mesh(geometry,material);
              TrussRoofInner2.name = "TrussRoofInner";
              TrussRoofInner2.rotation.set(Math.PI / -2, Math.PI / 2, Math.PI);
              TrussRoofInner2.position.set(1, params.height - 1, -mirrorGap);
              TrussMasterR.add(TrussRoofInner2);
              geometry = new THREE.BoxGeometry(0.04,1,0.04);
              geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0.5, 0));
              material = new THREE.MeshPhongMaterial({
                color: 0x421413,
                name: "Webbing",
                specular: 0x333333,
                shininess: 40
              });
              Webbing = new THREE.Mesh(geometry,material);
              Webbing.geometry.computeVertexNormals();
              Webbing.visible = false;
              Webbing.name = "Webbing";
              scene.add(Webbing);
              WebbingMasterL = new THREE.Group();
              WebbingMasterL.name = "WebbingMasterL";
              scene.add(WebbingMasterL);
              WebbingMasterR = new THREE.Group();
              WebbingMasterR.name = "WebbingMasterR";
              scene.add(WebbingMasterR);
              var FramingParent = new THREE.Group();
              FramingParent.name = "FramingParent";
              scene.add(FramingParent);
              var FramingParentRoofL = new THREE.Group();
              FramingParentRoofL.name = "FramingParentRoofL";
              scene.add(FramingParentRoofL);
              var FramingParentRoofR = new THREE.Group();
              FramingParentRoofR.name = "FramingParentRoofR";
              scene.add(FramingParentRoofR);
              geometry = new THREE.BoxGeometry(0.19,0.085,1);
              material = new THREE.MeshPhongMaterial({
                color: 0x999999,
                name: "framing",
                specular: 0x3C3C3C,
                shininess: 40
              });
              var Framing = new THREE.Mesh(geometry,material);
              Framing.visible = false;
              Framing.name = "Framing";
              scene.add(Framing);
              loader = new THREE.JSONLoader();
              loader.crossOrigin = "anonymous";
              loader.load('public/Leanto1.json', function(geometry, materials) {
                var material = new THREE.MultiMaterial(materials);
                geometry.computeFaceNormals();
                geometry.normalsNeedUpdate;
                geometry.tangentsNeedUpdate;
                for (var m = 0; m < materials.length; m++) {
                  materials[m].morphTargets = true;
                  if (materials[m].name === 'LeantoWainscot1' || materials[m].name === 'LeantoWainscot3' || materials[m].name === 'LeantoWallsDepth' || materials[m].name === 'LeantoWallsDepth-Interior' || materials[m].name === 'LeantoCeiling') {
                    materials[m].normalMap = eval('textureHalfTruss1Depth');
                  }
                  if (materials[m].name === 'LeantoWallsWidth' || materials[m].name === 'LeantoWallsWidth-Interior' || materials[m].name === 'LeantoWainscot2') {
                    materials[m].normalMap = eval('textureHalfTruss1Width');
                  }
                  if (materials[m].name === 'LeantoWallsDepth-Interior' || materials[m].name === 'LeantoWallsWidth-Interior') {
                    materials[m].emissive.setHex(0x555555);
                  }
                  if (materials[m].name === 'LeantoCeiling') {
                    materials[m].emissive.setHex(0x333333);
                  }
                  if (materials[m].name === 'LeantoWainscot1' || materials[m].name === 'LeantoWainscot2' || materials[m].name === 'LeantoWainscot3' || materials[m].name === 'LeantoWainscotTrim1' || materials[m].name === 'LeantoWainscotTrim2' || materials[m].name === 'LeantoWainscotTrim3') {
                    materials[m].visible = false;
                  }
                }
                var halfTruss1 = new THREE.Mesh(geometry,material);
                halfTruss1.name = 'halfTruss1';
                halfTruss1.normalsNeedUpdate = true;
                halfTruss1.verticesNeedUpdate = true;
                halfTruss1.castShadow = true;
                halfTruss1.receiveShadow = true;
                halfTruss1.morphTargets = true;
                halfTruss1.visible = false;
                halfTruss1.frustumCulled = false;
                halfTruss1.position.set(0, 0, params.depth / 2);
                scene.add(halfTruss1);
                loader = new THREE.JSONLoader();
                loader.crossOrigin = "anonymous";
                loader.load('public/Leanto2.json', function(geometry, materials) {
                  var material = new THREE.MultiMaterial(materials);
                  geometry.computeFaceNormals();
                  geometry.normalsNeedUpdate;
                  geometry.tangentsNeedUpdate;
                  for (var m = 0; m < materials.length; m++) {
                    materials[m].morphTargets = true;
                    if (materials[m].name === 'LeantoWainscot1' || materials[m].name === 'LeantoWainscot3' || materials[m].name === 'LeantoWallsDepth' || materials[m].name === 'LeantoWallsDepth-Interior' || materials[m].name === 'LeantoCeiling') {
                      materials[m].normalMap = eval('textureHalfTruss2Depth');
                    }
                    if (materials[m].name === 'LeantoWallsWidth' || materials[m].name === 'LeantoWallsWidth-Interior' || materials[m].name === 'LeantoWainscot2') {
                      materials[m].normalMap = eval('textureHalfTruss2Width');
                    }
                    if (materials[m].name === 'LeantoWallsDepth-Interior' || materials[m].name === 'LeantoWallsWidth-Interior') {
                      materials[m].emissive.setHex(0x555555);
                    }
                    if (materials[m].name === 'LeantoCeiling') {
                      materials[m].emissive.setHex(0x333333);
                    }
                    if (materials[m].name === 'LeantoWainscot1' || materials[m].name === 'LeantoWainscot2' || materials[m].name === 'LeantoWainscot3' || materials[m].name === 'LeantoWainscotTrim1' || materials[m].name === 'LeantoWainscotTrim2' || materials[m].name === 'LeantoWainscotTrim3') {
                      materials[m].visible = false;
                    }
                  }
                  var halfTruss2 = new THREE.Mesh(geometry,material);
                  halfTruss2.name = 'halfTruss2';
                  halfTruss2.normalsNeedUpdate = true;
                  halfTruss2.verticesNeedUpdate = true;
                  halfTruss2.castShadow = true;
                  halfTruss2.receiveShadow = true;
                  halfTruss2.morphTargets = true;
                  halfTruss2.visible = false;
                  halfTruss2.frustumCulled = false;
                  halfTruss2.position.set(params.width / -2, 0, 0);
                  scene.add(halfTruss2);
                  loader = new THREE.JSONLoader();
                  loader.crossOrigin = "anonymous";
                  loader.load('public/Leanto3.json', function(geometry, materials) {
                    var material = new THREE.MultiMaterial(materials);
                    geometry.computeFaceNormals();
                    geometry.normalsNeedUpdate;
                    geometry.tangentsNeedUpdate;
                    for (var m = 0; m < materials.length; m++) {
                      materials[m].morphTargets = true;
                      if (materials[m].name === 'LeantoWainscot1' || materials[m].name === 'LeantoWainscot3' || materials[m].name === 'LeantoWallsDepth' || materials[m].name === 'LeantoWallsDepth-Interior' || materials[m].name === 'LeantoCeiling') {
                        materials[m].normalMap = eval('textureHalfTruss3Depth');
                      }
                      if (materials[m].name === 'LeantoWallsWidth' || materials[m].name === 'LeantoWallsWidth-Interior' || materials[m].name === 'LeantoWainscot2') {
                        materials[m].normalMap = eval('textureHalfTruss3Width');
                      }
                      if (materials[m].name === 'LeantoWallsDepth-Interior' || materials[m].name === 'LeantoWallsWidth-Interior') {
                        materials[m].emissive.setHex(0x555555);
                      }
                      if (materials[m].name === 'LeantoCeiling') {
                        materials[m].emissive.setHex(0x333333);
                      }
                      if (materials[m].name === 'LeantoWainscot1' || materials[m].name === 'LeantoWainscot2' || materials[m].name === 'LeantoWainscot3' || materials[m].name === 'LeantoWainscotTrim1' || materials[m].name === 'LeantoWainscotTrim2' || materials[m].name === 'LeantoWainscotTrim3') {
                        materials[m].visible = false;
                      }
                    }
                    var halfTruss3 = new THREE.Mesh(geometry,material);
                    halfTruss3.name = 'halfTruss3';
                    halfTruss3.normalsNeedUpdate = true;
                    halfTruss3.verticesNeedUpdate = true;
                    halfTruss3.castShadow = true;
                    halfTruss3.receiveShadow = true;
                    halfTruss3.morphTargets = true;
                    halfTruss3.visible = false;
                    halfTruss3.frustumCulled = false;
                    halfTruss3.position.set(0, 0, params.depth / -2);
                    scene.add(halfTruss3);
                    loader = new THREE.JSONLoader();
                    loader.crossOrigin = "anonymous";
                    loader.load('public/Leanto4.json', function(geometry, materials) {
                      var material = new THREE.MultiMaterial(materials);
                      geometry.computeFaceNormals();
                      geometry.normalsNeedUpdate;
                      geometry.tangentsNeedUpdate;
                      for (var m = 0; m < materials.length; m++) {
                        materials[m].morphTargets = true;
                        if (materials[m].name === 'LeantoWainscot1' || materials[m].name === 'LeantoWainscot3' || materials[m].name === 'LeantoWallsDepth' || materials[m].name === 'LeantoWallsDepth-Interior' || materials[m].name === 'LeantoCeiling') {
                          materials[m].normalMap = eval('textureHalfTruss4Depth');
                        }
                        if (materials[m].name === 'LeantoWallsWidth' || materials[m].name === 'LeantoWallsWidth-Interior' || materials[m].name === 'LeantoWainscot2') {
                          materials[m].normalMap = eval('textureHalfTruss4Width');
                        }
                        if (materials[m].name === 'LeantoWallsDepth-Interior' || materials[m].name === 'LeantoWallsWidth-Interior') {
                          materials[m].emissive.setHex(0x555555);
                        }
                        if (materials[m].name === 'LeantoCeiling') {
                          materials[m].emissive.setHex(0x333333);
                        }
                        if (materials[m].name === 'LeantoWainscot1' || materials[m].name === 'LeantoWainscot2' || materials[m].name === 'LeantoWainscot3' || materials[m].name === 'LeantoWainscotTrim1' || materials[m].name === 'LeantoWainscotTrim2' || materials[m].name === 'LeantoWainscotTrim3') {
                          materials[m].visible = false;
                        }
                      }
                      var halfTruss4 = new THREE.Mesh(geometry,material);
                      halfTruss4.name = 'halfTruss4';
                      halfTruss4.normalsNeedUpdate = true;
                      halfTruss4.verticesNeedUpdate = true;
                      halfTruss4.castShadow = true;
                      halfTruss4.receiveShadow = true;
                      halfTruss4.morphTargets = true;
                      halfTruss4.visible = false;
                      halfTruss4.frustumCulled = false;
                      halfTruss4.position.set(params.width / 2, 0, 0);
                      scene.add(halfTruss4);
                      for (n = 1; n <= 4; n++) {
                        currentName = "halfTruss" + n;
                        eval("var " + currentName + "Roof = scene.getObjectByName('roofL').clone()");
                        eval(currentName + "Roof").material = scene.getObjectByName('roofL').material.clone();
                        for (var m = 0; m < eval(currentName + "Roof").material.length; m++) {
                          eval(currentName + "Roof").material[m].morphTargets = true;
                          if (eval(currentName + "Roof").material[m].name === 'BuildingRoof' || eval(currentName + "Roof").material[m].name === 'BuildingSoffit') {
                            eval(currentName + "Roof").material[m].normalMap = eval('textureHalfTruss' + n + 'Depth');
                          }
                        }
                        eval(currentName + "Roof").name = currentName + "Roof";
                        eval(currentName + "Roof").visible = false;
                        scene.add(eval(currentName + "Roof"));
                        eval(currentName).rotation.x = Math.PI / -2;
                        if (n === 1) {
                          eval(currentName + "Roof").position.set(0, 0, params.depth / 2);
                          eval(currentName + "Roof").rotation.set(0, 0, Math.PI / -2);
                        } else if (n === 2) {
                          eval(currentName + "Roof").position.set(params.width / -2, 0, 0);
                          eval(currentName + "Roof").rotation.set(0, 0, Math.PI);
                        } else if (n === 3) {
                          eval(currentName + "Roof").position.set(0, 0, params.depth / -2);
                          eval(currentName + "Roof").rotation.set(0, 0, Math.PI / 2);
                        } else if (n === 4) {
                          eval(currentName + "Roof").position.set(params.width / 2, 0, 0);
                          eval(currentName + "Roof").rotation.set(0, 0, 0);
                        }
                      }



                      updateColors();
                      updateRoofPitch();
                      updateBuildingSize();
                      updateWainscot();
                      updateRoofType();
                      updateColors();
                    }); //leanTo4
                  }); //leanTo3
                }); //leanTo2
              }); //leanTo1
            }); //Truss
          }); //Roof
        //}); //logo
      }); //Building

      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.03;
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;
      controls.rotateSpeed = 0.1;
      controls.minDistance = 1;
      controls.maxDistance = 200;
      controls.maxPolarAngle = Math.PI / 2 - 0.04;
      controls.target.set(0, params.height / 2, 0);
    } //end init

    controls.addEventListener('start', function () {
      controls.autoRotate = false;
    });

    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
      controls.update();
    }

    function updateFoundation() {
      var foundation = scene.getObjectByName('foundation');
      var addLeft = 0;
      var addRight = 0;
      var addFront = 0;
      var addBack = 0;
      if (params.halfTruss2) {
        addLeft = params.halfTruss2Depth;
      }
      if (params.halfTruss4) {
        addRight = params.halfTruss4Depth;
      }
      if (params.halfTruss1) {
        addFront = params.halfTruss1Depth;
      }
      if (params.halfTruss3) {
        addBack = params.halfTruss3Depth;
      }
      foundation.scale.x = params.width + addLeft + addRight + 8 / 12;
      foundation.scale.z = params.depth + addFront + addBack + 8 / 12;
      foundation.position.x = (addRight - addLeft) / 2;
      foundation.position.z = (addFront - addBack) / 2;
      foundation.material.map.repeat.set((params.width + 8 / 12) / 10, (params.depth + 8 / 12) / 10);
      foundation.material.map.offset.x = ((params.width + 8 / 12) / -20) + 0.5;
      foundation.material.map.offset.y = ((params.depth + 8 / 12) / -20) + 0.5;
    }

    function updateBuildingSize() {

      if (params.halfTruss1 || params.halfTruss3 || params.halfTruss2 || params.halfTruss4) {
        if (scene.getObjectByName('halfTruss1')) {
          var name = '';
          for (m = 1; m <= 4; m++) {
            currentName = "halfTruss" + m;
            if (scene.getObjectByName(currentName).visible != params[currentName]) {
              params[currentName + 'Height'] = params.height;
              if (m === 1 || m === 3) {
                params[currentName + 'Length'] = params.width;
              } else {
                params[currentName + 'Length'] = params.depth;
              }
            }
            if (typeof scene.getObjectByName(currentName) != 'undefined') {
              scene.getObjectByName(currentName).visible = params[currentName];
              scene.getObjectByName(currentName + "Roof").visible = params[currentName];
              if (params[currentName] == false) {
                scene.getObjectByName(currentName + 'BoundingBox').position.set(0, 0, 0);
                scene.getObjectByName(currentName + 'BoundingBox').scale.set(0.1, 0.1, 0.1);
              }
              if (m === 2 || m === 4) {
                params[currentName + 'Length'] = params.depth;
                params[currentName + 'Height'] = params.height;
              }
            }
          }
        }
      } else {
        var name = '';
        for (m = 0; m < 4; m++) {
          currentName = "halfTruss" + (m + 1);
          currentNameBoundingBox = currentName + "BoundingBox";
          if (typeof scene.getObjectByName(currentName) != 'undefined') {
            scene.getObjectByName(currentName).visible = params[currentName];
            scene.getObjectByName(currentName + "Roof").visible = params[currentName];
            scene.getObjectByName(currentNameBoundingBox).position.set(0, 0, 0);
            scene.getObjectByName(currentNameBoundingBox).scale.set(0.1, 0.1, 0.1);
          }
        }
      }

      materials = scene.getObjectByName("building").material.materials;
      for (var t = 0; t < materials.length; t++) {
        if (materials[t].name === 'BuildingTrim1' || materials[t].name === 'BuildingTrim2' || materials[t].name === 'BuildingTrim3' || materials[t].name === 'BuildingTrim4' || materials[t].name === "BuildingWallsDepthL" || materials[t].name === "BuildingWallsDepthL-Interior" || materials[t].name === "BuildingWallsDepthR" || materials[t].name === "BuildingWallsDepthR-Interior") {
          materials[t].visible = true;
        }
      }

      scene.traverse(function(child) {
        if (child instanceof THREE.Mesh) {
          var m = 0;
          if (child.name === 'building') {
            if (params.roofType === 'Asymmetrical') {
              child.morphTargetInfluences[child.morphTargetDictionary.right] = (params.asymmetrical) / 100;
            } else {
              child.morphTargetInfluences[child.morphTargetDictionary.right] = 0;
            }
            var addLeft = 0;
            var addRight = 0;
            var addFront = 0;
            var addBack = 0;
            if (params.halfTruss2) {
              addLeft = params.halfTruss2Depth;
            }
            if (params.halfTruss4) {
              addRight = params.halfTruss4Depth;
            }
            if (params.halfTruss1) {
              addFront = params.halfTruss1Depth;
            }
            if (params.halfTruss3) {
              addBack = params.halfTruss3Depth;
            }
            buildingBoundingBox.scale.set(params.width, params.height, params.depth);
            child.morphTargetInfluences[child.morphTargetDictionary.width] = (params.width - 1) / 100;
            child.morphTargetInfluences[child.morphTargetDictionary.depth] = (params.depth - 1) / 1000;
            if (child.morphTargetInfluences[child.morphTargetDictionary.height] != (params.height - 1) / 100) {
              child.morphTargetInfluences[child.morphTargetDictionary.height] = (params.height - 1) / 100;
            }
            for (m = 0; m < child.material.materials.length; m++) {
              var width, offset;
              if (child.material.materials[m].name === 'BuildingWallsWidthLeftFront' || child.material.materials[m].name === 'BuildingWallsWidthLeftBack') {
                if (params.roofType === 'Asymmetrical') {
                  width = (params.width) + (params.asymmetrical * 2);
                  offset = params.asymmetrical;
                } else {
                  width = (params.width);
                  offset = 0;
                }
                child.material.materials[m].normalMap.repeat.set((width * 12 / 9), 1);
                child.material.materials[m].normalMap.offset.x = (((width + offset) * 12 / 9)) + 0.5;
              }
              if (child.material.materials[m].name === 'BuildingWallsWidthRightFront' || child.material.materials[m].name === 'BuildingWallsWidthRightBack') {
                if (params.roofType === 'Asymmetrical') {
                  width = (params.width) - (params.asymmetrical * 2);
                  offset = params.asymmetrical;
                } else {
                  width = (params.width);
                  offset = 0;
                }
                child.material.materials[m].normalMap.repeat.set((width * 12 / 9), 1);
                child.material.materials[m].normalMap.offset.x = (((width + offset) * 12 / 9)) + 0.5;
              }
              if (child.material.materials[m].name === 'BuildingWallsWidth' || child.material.materials[m].name === 'BuildingWainscot1' || child.material.materials[m].name === 'BuildingWainscot3') {
                child.material.materials[m].normalMap.repeat.set((params.width * 12 / 9), 1);
                child.material.materials[m].normalMap.offset.x = ((params.width * 12 / 9)) + 0.5;
              }
              if (child.material.materials[m].name === 'BuildingWallsDepthL' || child.material.materials[m].name === 'BuildingWallsDepthR' || child.material.materials[m].name === 'BuildingWainscot2' || child.material.materials[m].name === 'BuildingWainscot4') {
                child.material.materials[m].normalMap.repeat.set((params.depth * 12 / 9), 1);
                child.material.materials[m].normalMap.offset.x = ((params.depth * 12 / 9)) + 0.5;
              }
            }
          }
          if (child.name === 'roofL' || child.name === 'roofR' || child.name === 'roofEaveL' || child.name === 'roofEaveR') {
            child.morphTargetInfluences[child.morphTargetDictionary.depth] = (params.depth + params.gableFront + params.gableBack - 1) / 1000;
            child.position.z = (params.gableFront / 2) - (params.gableBack / 2);
            for (m = 0; m < child.material.materials.length; m++) {
              if (child.material.materials[m].name === 'BuildingRoof' || child.material.materials[m].name === 'BuildingSoffit') {
                child.material.materials[m].normalMap.repeat.set(((params.depth + params.gableFront + params.gableBack) * 12 / 9), 1);
                child.material.materials[m].normalMap.offset.x = ((((params.depth + (params.gableFront / 2) - (params.gableBack * 6)) * 12 / 9)) + 0.5);
              }
            }
          }


          if (child.name === 'halfTruss1' || child.name === 'halfTruss2' || child.name === 'halfTruss3' || child.name === 'halfTruss4') {
            var halfTrussNum = child.name.replace(/\D/g, '');
            var roofHeightAdjustment = 0.1;
            if (child.name === 'halfTruss1') {
              child.position.set(0, 0, params.depth / 2);
              scene.getObjectByName(child.name + 'Roof').position.set(0, 0, params.depth / 2);
            }
            if (child.name === 'halfTruss2') {
              child.position.set(params.width / -2, 0, 0);
              scene.getObjectByName(child.name + 'Roof').position.set(params.width / -2, 0, 0);
            }
            if (child.name === 'halfTruss3') {
              child.position.set(0, 0, params.depth / -2);
              scene.getObjectByName(child.name + 'Roof').position.set(0, 0, params.depth / -2);
            }
            if (child.name === 'halfTruss4') {
              child.position.set(params.width / 2, 0, 0);
              scene.getObjectByName(child.name + 'Roof').position.set(params.width / 2, 0, 0);
            }
            if (child.name === 'halfTruss1' && params.halfTruss1) {
              scene.getObjectByName('halfTruss1BoundingBox').position.set(0, 0, params.depth / 2);
            }
            if (child.name === 'halfTruss2' && params.halfTruss2) {
              scene.getObjectByName('halfTruss2BoundingBox').position.set(params.width / -2, 0, 0);
            }
            if (child.name === 'halfTruss3' && params.halfTruss3) {
              scene.getObjectByName('halfTruss3BoundingBox').position.set(0, 0, params.depth / -2);
            }
            if (child.name === 'halfTruss4' && params.halfTruss4) {
              scene.getObjectByName('halfTruss4BoundingBox').position.set(params.width / 2, 0, 0);
            }
            if (params["halfTruss" + halfTrussNum + "Pitch"] < 0.5) {
              params["halfTruss" + halfTrussNum + "Pitch"] = 0.5;
            }
            if (params["halfTruss" + halfTrussNum + "Height"] > params.height) {
              params["halfTruss" + halfTrussNum + "Height"] = params.height;
            }
            if (halfTrussNum == 1 || halfTrussNum == 3) {
              if (params["halfTruss" + halfTrussNum + "Length"] > params.width) {
                params["halfTruss" + halfTrussNum + "Length"] = params.width;
              }
            } else if (halfTrussNum == 2 || halfTrussNum == 4) {
              if (params["halfTruss" + halfTrussNum + "Length"] > params.depth) {
                params["halfTruss" + halfTrussNum + "Length"] = params.depth;
              }
            }
            height = (params["halfTruss" + halfTrussNum + "Depth"] * params["halfTruss" + halfTrussNum + "Pitch"] / 12);
            var pitchRadians = Math.atan(params["halfTruss" + halfTrussNum + "Depth"] / height);
            var hypotenuseLength = Math.sqrt(Math.pow(height, 2) + Math.pow(params["halfTruss" + halfTrussNum + "Depth"], 2));
            child.morphTargetInfluences[child.morphTargetDictionary.roofPeak] = height / 100;
            scene.getObjectByName("halfTruss" + halfTrussNum + "Roof").position.y = params["halfTruss" + halfTrussNum + "Height"] + roofHeightAdjustment;
            if (halfTrussNum == 1) {
              scene.getObjectByName("halfTruss" + halfTrussNum + "Roof").rotation.x = -pitchRadians;
            }
            if (halfTrussNum == 2) {
              scene.getObjectByName("halfTruss" + halfTrussNum + "Roof").rotation.set(Math.PI / -2, pitchRadians - (Math.PI / 2), Math.PI);
            }
            if (halfTrussNum == 3) {
              scene.getObjectByName("halfTruss" + halfTrussNum + "Roof").rotation.x = pitchRadians - Math.PI;
            }
            if (halfTrussNum == 4) {
              scene.getObjectByName("halfTruss" + halfTrussNum + "Roof").rotation.set(Math.PI / -2, (Math.PI / 2) - pitchRadians, 0);
            }
            if (halfTrussNum == 2 || halfTrussNum == 4) {
              scene.getObjectByName("halfTruss" + halfTrussNum + "Roof").position.z = (params["gableFront"] - params["gableBack"]) / 2;
            }
            scene.getObjectByName("halfTruss" + halfTrussNum + "Roof").morphTargetInfluences[scene.getObjectByName("halfTruss" + halfTrussNum + "Roof").morphTargetDictionary.width] = ((hypotenuseLength - .5) / 50);
            if (halfTrussNum == 2 || halfTrussNum == 4) {
              scene.getObjectByName("halfTruss" + halfTrussNum + "Roof").morphTargetInfluences[scene.getObjectByName("halfTruss" + halfTrussNum + "Roof").morphTargetDictionary.depth] = ((params["halfTruss" + halfTrussNum + "Length"] + params["gableFront"] + params["gableBack"] - 1) / 1000);
            } else {
              scene.getObjectByName("halfTruss" + halfTrussNum + "Roof").morphTargetInfluences[scene.getObjectByName("halfTruss" + halfTrussNum + "Roof").morphTargetDictionary.depth] = ((params["halfTruss" + halfTrussNum + "Length"] - 1) / 1000);
            }
            child.morphTargetInfluences[child.morphTargetDictionary.depth] = (params["halfTruss" + halfTrussNum + "Length"] - 1) / 1000;
            child.morphTargetInfluences[child.morphTargetDictionary.width] = (params["halfTruss" + halfTrussNum + "Depth"] - 0.5) / 50;
            child.morphTargetInfluences[child.morphTargetDictionary.height] = (params["halfTruss" + halfTrussNum + "Height"] - 1 - height) / 100;
            if (child.name === 'halfTruss1' && params.halfTruss1) {
              scene.getObjectByName('halfTruss1BoundingBox').scale.set(params["halfTruss" + halfTrussNum + "Length"], params["halfTruss" + halfTrussNum + "Height"], params["halfTruss" + halfTrussNum + "Depth"]);
            }
            if (child.name === 'halfTruss2' && params.halfTruss2) {
              scene.getObjectByName('halfTruss2BoundingBox').scale.set(params["halfTruss" + halfTrussNum + "Length"], params["halfTruss" + halfTrussNum + "Height"], params["halfTruss" + halfTrussNum + "Depth"]);
            }
            if (child.name === 'halfTruss3' && params.halfTruss3) {
              scene.getObjectByName('halfTruss3BoundingBox').scale.set(params["halfTruss" + halfTrussNum + "Length"], params["halfTruss" + halfTrussNum + "Height"], params["halfTruss" + halfTrussNum + "Depth"]);
            }
            if (child.name === 'halfTruss4' && params.halfTruss4) {
              scene.getObjectByName('halfTruss4BoundingBox').scale.set(params["halfTruss" + halfTrussNum + "Length"], params["halfTruss" + halfTrussNum + "Height"], params["halfTruss" + halfTrussNum + "Depth"]);
            }
            var materials = scene.getObjectByName("halfTruss" + halfTrussNum).material.materials;
            for (var t = 0; t < materials.length; t++) {
              if (materials[t].name === 'LeantoWallsDepth') {
                materials[t].normalMap.repeat.set((params["halfTruss" + halfTrussNum + "Length"] * 12 / 9), 1);
                materials[t].normalMap.offset.x = ((params["halfTruss" + halfTrussNum + "Length"] * 12 / 9)) + 0.5;
              }
              if (materials[t].name === 'LeantoWallsWidth') {
                materials[t].normalMap.repeat.set((params["halfTruss" + halfTrussNum + "Depth"] * 24 / 9), 1);
                materials[t].normalMap.offset.x = ((params["halfTruss" + halfTrussNum + "Depth"] * 24 / 9)) + 0.5;
              }
            }
            materials = scene.getObjectByName("building").material.materials;
            if (params["halfTruss" + halfTrussNum] && params["halfTruss" + halfTrussNum + 'Height'] == params.height && (((halfTrussNum == 1 || halfTrussNum == 3) && params["halfTruss" + halfTrussNum + "Length"] == params.width) || ((halfTrussNum == 2 || halfTrussNum == 4) && params["halfTruss" + halfTrussNum + "Length"] == params.depth))) {
              for (var t = 0; t < materials.length; t++) {
                if (halfTrussNum == 2 && (materials[t].name === "BuildingWallsDepthL" || materials[t].name === "BuildingWallsDepthL-Interior")) {
                  materials[t].visible = false;
                }
                if (halfTrussNum == 4 && (materials[t].name === "BuildingWallsDepthR" || materials[t].name === "BuildingWallsDepthR-Interior")) {
                  materials[t].visible = false;
                }
                if (materials[t].name === "BuildingTrim" + halfTrussNum) {
                  materials[t].visible = false;
                }
                if (halfTrussNum - 1 == 0) {
                  if (materials[t].name === "BuildingTrim4") {
                    materials[t].visible = false;
                  }
                } else if (materials[t].name === "BuildingTrim" + (halfTrussNum - 1)) {
                  materials[t].visible = false;
                }
              }
            }
          }
        }
      });
      updateRoofPitch();
      updateFoundation();
    }

    function updateWainscot() {
      scene.traverse(function(child) {
        if (child instanceof THREE.Mesh) {
          if (child.name === 'building' || child.name === 'halfTruss1' || child.name === 'halfTruss2' || child.name === 'halfTruss3' || child.name === 'halfTruss4') {
            for (var m = 0; m < child.material.materials.length; m++) {
              if (child.material.materials[m].name === 'BuildingWainscot1' || child.material.materials[m].name === 'BuildingWainscotTrim1' || ((child.name === 'halfTruss1') && (child.material.materials[m].name === 'LeantoWainscot1' || child.material.materials[m].name === 'LeantoWainscotTrim1' || child.material.materials[m].name === 'LeantoWainscot2' || child.material.materials[m].name === 'LeantoWainscotTrim2' || child.material.materials[m].name === 'LeantoWainscot3' || child.material.materials[m].name === 'LeantoWainscotTrim3'))) {
                if (params.wainscot1) {
                  child.material.materials[m].visible = true;
                } else {
                  child.material.materials[m].visible = false;
                }
              }
              if (child.material.materials[m].name === 'BuildingWainscot2' || child.material.materials[m].name === 'BuildingWainscotTrim2' || ((child.name === 'halfTruss2') && (child.material.materials[m].name === 'LeantoWainscot1' || child.material.materials[m].name === 'LeantoWainscotTrim1' || child.material.materials[m].name === 'LeantoWainscot2' || child.material.materials[m].name === 'LeantoWainscotTrim2' || child.material.materials[m].name === 'LeantoWainscot3' || child.material.materials[m].name === 'LeantoWainscotTrim3'))) {
                if (params.wainscot2) {
                  child.material.materials[m].visible = true;
                } else {
                  child.material.materials[m].visible = false;
                }
              }
              if (child.material.materials[m].name === 'BuildingWainscot3' || child.material.materials[m].name === 'BuildingWainscotTrim3' || ((child.name === 'halfTruss3') && (child.material.materials[m].name === 'LeantoWainscot1' || child.material.materials[m].name === 'LeantoWainscotTrim1' || child.material.materials[m].name === 'LeantoWainscot2' || child.material.materials[m].name === 'LeantoWainscotTrim2' || child.material.materials[m].name === 'LeantoWainscot3' || child.material.materials[m].name === 'LeantoWainscotTrim3'))) {
                if (params.wainscot3) {
                  child.material.materials[m].visible = true;
                } else {
                  child.material.materials[m].visible = false;
                }
              }
              if (child.material.materials[m].name === 'BuildingWainscot4' || child.material.materials[m].name === 'BuildingWainscotTrim4' || ((child.name === 'halfTruss4') && (child.material.materials[m].name === 'LeantoWainscot1' || child.material.materials[m].name === 'LeantoWainscotTrim1' || child.material.materials[m].name === 'LeantoWainscot2' || child.material.materials[m].name === 'LeantoWainscotTrim2' || child.material.materials[m].name === 'LeantoWainscot3' || child.material.materials[m].name === 'LeantoWainscotTrim3'))) {
                if (params.wainscot4) {
                  child.material.materials[m].visible = true;
                } else {
                  child.material.materials[m].visible = false;
                }
              }
            }
          }
        }
      });
    }

    function updateRoofType() {
      var i = 0;
      if (params.roofType === 'Gabled') {
        for (i = 0; i < menu.__folders['Building Dimensions'].__controllers.length; i++) {
          var key = menu.__folders['Building Dimensions'].__controllers[i];
          if (key.property === 'asymmetrical') {
            key.domElement.parentElement.parentElement.hidden = true;
            key.updateDisplay();
          }
          if (key.property === 'roofPitch') {
            key.__min = 0;
            if (params.roofPitch < 0.5) {
              params.roofPitch = 0.5;
            }
            key.updateDisplay();
          }
        }
        scene.traverse(function(child) {
          if (child instanceof THREE.Mesh) {
            if (child.name === 'roofL' || child.name === 'roofR') {
              for (var m = 0; m < child.material.materials.length; m++) {
                if (child.material.materials[m].name === 'BuildingRidgeCap') {
                  child.material.materials[m].visible = true;
                }
              }
            }
            if (child.name === 'building') {
              child.morphTargetInfluences[child.morphTargetDictionary.heightRight] = 0;
              child.morphTargetInfluences[child.morphTargetDictionary.heightLeft] = 0;
            }
          }
        });
      }
      if (params.roofType === 'Single Slope') {
        for (i = 0; i < menu.__folders['Building Dimensions'].__controllers.length; i++) {
          var key = menu.__folders['Building Dimensions'].__controllers[i];
          if (key.property === 'asymmetrical') {
            key.domElement.parentElement.parentElement.hidden = true;
            key.updateDisplay();
          }
          if (key.property === 'roofPitch') {
            key.__min = -12;
            key.__max = 12;
            key.updateDisplay();
          }
        }
        scene.traverse(function(child) {
          if (child instanceof THREE.Mesh && (child.name === 'roofL' || child.name === 'roofR')) {
            for (var m = 0; m < child.material.materials.length; m++) {
              if (child.material.materials[m].name === 'BuildingRidgeCap') {
                child.material.materials[m].visible = false;
              }
            }
          }
        });
      }
      if (params.roofType === 'Asymmetrical') {
        for (i = 0; i < menu.__folders['Building Dimensions'].__controllers.length; i++) {
          var key = menu.__folders['Building Dimensions'].__controllers[i];
          if (key.property === 'asymmetrical') {
            key.domElement.parentElement.parentElement.hidden = false;
            key.__min = (params.width / -2) + 3;
            key.__max = (params.width / 2) - 3;
            if (params.asymmetrical < (params.width / -2) + 3) {
              params.asymmetrical = (params.width / -2) + 3;
            }
            if (params.asymmetrical > (params.width / 2) - 3) {
              params.asymmetrical = (params.width / 2) - 3;
            }
            key.updateDisplay();
          }
          if (key.property === 'roofPitch') {
            key.__min = 0;
            key.__max = 12;
            if (params.roofPitch < 0.5) {
              params.roofPitch = 0.5;
            }
            key.updateDisplay();
          }
        }
        scene.traverse(function(child) {
          if (child instanceof THREE.Mesh) {
            if (child.name === 'roofL' || child.name === 'roofR') {
              for (var m = 0; m < child.material.materials.length; m++) {
                if (child.material.materials[m].name === 'BuildingRidgeCap') {
                  child.material.materials[m].visible = true;
                }
              }
            }
            if (child.name === 'building') {
              child.morphTargetInfluences[child.morphTargetDictionary.heightRight] = 0;
              child.morphTargetInfluences[child.morphTargetDictionary.heightLeft] = 0;
            }
          }
        });
      }
      updateBuildingSize();
    }

    function updateRoofPitch() {
      if (params.roofPitch > 0.5 || params.roofType === 'Asymmetrical') {
        params.roofPitch = Math.round(params.roofPitch);
      }
      if (params.eavePitchL > 0.5) {
        params.eavePitchL = Math.round(params.eavePitchL);
      } else {
        params.eavePitchL = 0.5;
      }
      if (params.eavePitchR > 0.5) {
        params.eavePitchR = Math.round(params.eavePitchR);
      } else {
        params.eavePitchR = 0.5;
      }
      var roofHeightAdjustment = 0.1;
      var MaxWallHeight = params.height;
      var wallHeightL = params.height;
      var wallHeightR = params.height;
      var height = 0;
      if (params.roofType === 'Single Slope') {
        MaxWallHeight = MaxWallHeight + (params.width * Math.abs(params.roofPitch) / 12);
        if (params.width * params.roofPitch / 12 < 0) {
          wallHeightL = wallHeightL + (params.width * Math.abs(params.roofPitch) / 12);
        }
        if (params.width * params.roofPitch / 12 > 0) {
          wallHeightR = wallHeightR + (params.width * Math.abs(params.roofPitch) / 12);
        }
      }
      if (params.roofType === 'Single Slope') {
        height = (params.width * Math.abs(params.roofPitch) / 12);
        var pitchRadians = Math.atan((params.width) / height);
        var hypotenuseLength = Math.sqrt(Math.pow(height, 2) + Math.pow(params.width, 2));
        var hypotenuseLengthL = hypotenuseLength / 2;
        var hypotenuseLengthR = hypotenuseLength / 2;
        scene.traverse(function(child) {
          if (child instanceof THREE.Mesh) {
            if (child.name === 'roofL') {
              if (params.roofPitch < 0) {
                child.rotation.y = (Math.PI / -180 * -90) - pitchRadians;
              } else {
                child.rotation.y = (Math.PI / 180 * -90) + pitchRadians;
              }
              child.position.x = 0;
              child.position.y = (height / 2) + params.height + roofHeightAdjustment;
              child.morphTargetInfluences[child.morphTargetDictionary.width] = (((hypotenuseLength / 2) - 0.5) / 50) + (params.eaveL / 50);
            }
            if (child.name === 'roofR') {
              if (params.roofPitch < 0) {
                child.rotation.y = (Math.PI / -180 * -90) - pitchRadians;
              } else {
                child.rotation.y = (Math.PI / 180 * -90) + pitchRadians;
              }
              child.position.x = 0;
              child.position.y = (height / 2) + params.height + roofHeightAdjustment;
              child.morphTargetInfluences[child.morphTargetDictionary.width] = (((hypotenuseLength / 2) - 0.5) / 50) + (params.eaveR / 50);
            }
            if (child.name === 'building') {
              if (params.roofPitch < 0) {
                child.morphTargetInfluences[child.morphTargetDictionary.heightLeft] = height / 100;
                child.morphTargetInfluences[child.morphTargetDictionary.heightRight] = 0;
              } else {
                child.morphTargetInfluences[child.morphTargetDictionary.heightRight] = height / 100;
                child.morphTargetInfluences[child.morphTargetDictionary.heightLeft] = 0;
              }
              child.morphTargetInfluences[child.morphTargetDictionary.roofPeak] = height / 100 / 2;
            }
          }
        });
      } else if (params.roofType === 'Asymmetrical') {
        if (params.roofPitch < 0.5) {
          params.roofPitch = 0.5;
        }
        var widthL = (params.width / 2) + params.asymmetrical;
        var widthR = (params.width / 2) - params.asymmetrical;
        var width = Math.max(widthL, widthR);
        height = (width * params.roofPitch / 12);
        var pitchRadiansL = Math.atan(widthL / height);
        var pitchRadiansR = Math.atan(widthR / height);
        var hypotenuseLengthL = Math.sqrt(Math.pow(height, 2) + Math.pow(widthL, 2));
        var hypotenuseLengthR = Math.sqrt(Math.pow(height, 2) + Math.pow(widthR, 2));
        scene.traverse(function(child) {
          if (child instanceof THREE.Mesh) {
            if (child.name === 'roofL') {
              child.rotation.y = (Math.PI / 180 * -90) + pitchRadiansL;
              child.position.x = params.asymmetrical;
              child.position.y = height + params.height + roofHeightAdjustment;
              child.morphTargetInfluences[child.morphTargetDictionary.width] = ((hypotenuseLengthL - 0.5) / 50) + (params.eaveL / 50);
            }
            if (child.name === 'roofR') {
              child.rotation.y = (Math.PI / 180 * 90) + -pitchRadiansR;
              child.position.x = params.asymmetrical;
              child.position.y = height + params.height + roofHeightAdjustment;
              child.morphTargetInfluences[child.morphTargetDictionary.width] = ((hypotenuseLengthR - 0.5) / 50) + (params.eaveR / 50);
            }
            if (child.name === 'building') {
              child.morphTargetInfluences[child.morphTargetDictionary.roofPeak] = height / 100;
            }
          }
        });
      } else {
        if (params.roofPitch < 0.5) {
          params.roofPitch = 0.5;
        }
        height = (params.width / 2 * params.roofPitch / 12);
        var pitchRadians = Math.atan((params.width / 2) / height);
        var pitchRadiansL = pitchRadians;
        var pitchRadiansR = pitchRadians;
        var eavePitchRadiansL = Math.atan(params.eavePitchL / 12);
        var eavePitchRadiansR = Math.atan(params.eavePitchR / 12);
        var hypotenuseLength = Math.sqrt(Math.pow(height, 2) + Math.pow(params.width / 2, 2));
        var hypotenuseLengthL = hypotenuseLength;
        var hypotenuseLengthR = hypotenuseLength;
        var halfTrussDepthL = 0;
        var halfTrussHeightReductionL = 0;
        if (params.halfTruss2) {
          halfTrussDepthL = params.halfTruss2Depth;
          halfTrussHeightReductionL = Math.tan(Math.atan(params.halfTruss2Pitch / 12)) * halfTrussDepthL;
        }
        var halfTrussDepthR = 0;
        var halfTrussHeightReductionR = 0;
        if (params.halfTruss4) {
          halfTrussDepthR = params.halfTruss4Depth;
          halfTrussHeightReductionR = Math.tan(Math.atan(params.halfTruss4Pitch / 12)) * halfTrussDepthR;
        }
        scene.traverse(function(child) {
          if (child instanceof THREE.Mesh) {
            if (child.name === 'roofL') {
              child.rotation.y = (Math.PI / 180 * -90) + pitchRadians;
              child.position.x = 0;
              child.position.y = height + params.height + roofHeightAdjustment;
              child.morphTargetInfluences[child.morphTargetDictionary.width] = ((hypotenuseLength - 0.5) / 50);
            }
            if (child.name === 'roofR') {
              child.rotation.y = (Math.PI / 180 * 90) + -pitchRadians;
              child.position.x = 0;
              child.position.y = height + params.height + roofHeightAdjustment;
              child.morphTargetInfluences[child.morphTargetDictionary.width] = ((hypotenuseLength - 0.5) / 50);
            }
            if (child.name === 'roofEaveL') {
              if (params.eaveL > 0) {
                child.visible = true;
                scene.getObjectByName('roofEaveL').position.x = (params.width / -2) - halfTrussDepthL;
                scene.getObjectByName('roofEaveL').position.y = params.height + roofHeightAdjustment - halfTrussHeightReductionL;
                child.rotation.y = -eavePitchRadiansL;
                child.morphTargetInfluences[child.morphTargetDictionary.width] = ((params.eaveL - 1) / 50);
              } else {
                child.visible = false;
              }
            }
            if (child.name === 'roofEaveR') {
              if (params.eaveR > 0) {
                child.visible = true;
                scene.getObjectByName('roofEaveR').position.x = (params.width / 2) + halfTrussDepthR;
                scene.getObjectByName('roofEaveR').position.y = params.height + roofHeightAdjustment - halfTrussHeightReductionR;
                child.rotation.y = eavePitchRadiansR;
                child.morphTargetInfluences[child.morphTargetDictionary.width] = ((params.eaveR - 1) / 50);
              } else {
                child.visible = false;
              }
            }
            if (child.name === 'building') {
              child.morphTargetInfluences[child.morphTargetDictionary.roofPeak] = height / 100;
            }
          }
        });
      }
      if (scene.getObjectByName('logo')) {
        var positionX;
        var positionY;
        if (params.roofType === 'Asymmetrical') {
          positionX = params.asymmetrical;
        } else {
          positionX = 0;
        }
        if (params.roofType === 'Single Slope') {
          positionY = params.height + (height / 2);
        } else {
          positionY = params.height + height;
        }
        scene.getObjectByName('logo').position.set(positionX, positionY - 1, params.depth / 2);
      }
      var trussAsymmetry = 0;
      if (params.roofType === 'Asymmetrical') {
        trussAsymmetry = params.asymmetrical;
      }
      var trussGapFromWall = 0.2;
      var trussFootingWidth = 0.66;
      var trussWidthL = (params.width / -2) + trussGapFromWall - trussAsymmetry;
      var trussWidthR = (params.width / -2) + trussGapFromWall + trussAsymmetry;
      scene.getObjectByName('TrussMasterL').position.x = (params.width / -2) + trussGapFromWall;
      scene.getObjectByName('TrussMasterR').position.x = (params.width / 2) - trussGapFromWall;
      var trussHeightL = wallHeightL - 0.5;
      var trussHeightR = wallHeightR - 0.5;
      var trussTangentWidth = 2;
      if (params.width < 25) {
        trussTangentWidth = 1.23;
      }
      var trussRoofRailSpacing = trussTangentWidth;
      var trussTangentAngleL = (Math.PI - pitchRadiansL) / 2;
      var trussTangentAngleR = (Math.PI - pitchRadiansR) / 2;
      var trussTangentLengthL = trussTangentWidth / Math.sin(trussTangentAngleL);
      var trussTangentLengthR = trussTangentWidth / Math.sin(trussTangentAngleR);
      var trussTangentHeightL = Math.sqrt(Math.pow(trussTangentLengthL, 2) - Math.pow(trussTangentWidth, 2));
      var trussTangentHeightR = Math.sqrt(Math.pow(trussTangentLengthR, 2) - Math.pow(trussTangentWidth, 2));
      var trussWallInnerLengthL = Math.sqrt(Math.pow(trussHeightL - trussTangentHeightL, 2) + Math.pow(trussTangentWidth - trussFootingWidth, 2));
      var trussWallInnerLengthR = Math.sqrt(Math.pow(trussHeightR - trussTangentHeightR, 2) + Math.pow(trussTangentWidth - trussFootingWidth, 2));
      var trussWallInnerAngleL = Math.atan(trussTangentHeightL / trussTangentLengthL);
      var trussWallInnerAngleR = Math.atan(trussTangentHeightR / trussTangentLengthR);
      var trussWallInnerAngleL = Math.acos((trussHeightL - trussTangentHeightL) / trussWallInnerLengthL);
      var trussWallInnerAngleR = Math.acos((trussHeightR - trussTangentHeightR) / trussWallInnerLengthR);
      var trussRoofOuterLengthL = Math.abs(trussWidthL) / Math.sin(pitchRadiansL);
      var trussRoofOuterLengthR = Math.abs(trussWidthR) / Math.sin(pitchRadiansR);
      var trussRoofInnerLengthL = (Math.abs(trussWidthL) - trussTangentWidth) / Math.sin(pitchRadiansL);
      var trussRoofInnerLengthR = (Math.abs(trussWidthR) - trussTangentWidth) / Math.sin(pitchRadiansR);
      var trussKeystoneLengthL = Math.abs(trussTangentWidth) / Math.sin(pitchRadiansL);
      var trussKeystoneLengthR = Math.abs(trussTangentWidth) / Math.sin(pitchRadiansR);
      scene.getObjectByName('TrussMasterL').traverse(function(child) {
        if (child instanceof THREE.Group) {
          if (child.name === 'TrussTangent') {
            child.position.set(0, trussHeightL, 0);
            child.rotation.z = trussTangentAngleL - (Math.PI / 2);
            child.scale.x = trussTangentLengthL;
          }
        } else if (child instanceof THREE.Mesh) {
          if (child.name === 'TrussWallOuter') {
            child.scale.z = trussHeightL;
          }
          if (child.name === 'TrussWallInner') {
            child.scale.z = trussWallInnerLengthL;
            child.rotation.y = trussWallInnerAngleL;
          }
          if (child.name === 'TrussRoofOuter') {
            child.scale.z = trussRoofOuterLengthL;
            child.position.y = trussHeightL;
            child.rotation.y = pitchRadiansL;
          }
          if (child.name === 'TrussRoofInner') {
            child.scale.z = trussRoofInnerLengthL;
            child.position.x = trussTangentWidth;
            child.position.y = trussHeightL - trussTangentHeightL;
            child.rotation.y = pitchRadiansL;
          }
          if (child.name === 'TrussKeystone') {
            child.scale.z = trussKeystoneLengthL;
            child.position.set(child.parent.position.x * -1 + trussAsymmetry, positionY - 0.6, 0);
          }
        }
      });
      if (typeof scene.getObjectByName('TrussClones') != 'undefined') {
        scene.remove(scene.getObjectByName('TrussClones'));
      }
      if (typeof scene.getObjectByName('WebbingMasterL') != 'undefined') {
        scene.remove(scene.getObjectByName('WebbingMasterL'));
      }
      if (typeof scene.getObjectByName('WebbingMasterR') != 'undefined') {
        scene.remove(scene.getObjectByName('WebbingMasterR'));
      }
      if (typeof scene.getObjectByName('WebbingRoofMasterL') != 'undefined') {
        scene.remove(scene.getObjectByName('WebbingRoofMasterL'));
      }
      if (typeof scene.getObjectByName('WebbingRoofMasterR') != 'undefined') {
        scene.remove(scene.getObjectByName('WebbingRoofMasterR'));
      }
      if (typeof scene.getObjectByName('WebbingMasterL') == 'undefined') {
        WebbingMasterL = new THREE.Group();
        WebbingMasterL.name = "WebbingMasterL";
        WebbingMasterL.position.x = (params.width / -2) + trussGapFromWall;
        scene.add(WebbingMasterL);
      }
      if (typeof scene.getObjectByName('WebbingMasterR') == 'undefined') {
        WebbingMasterR = new THREE.Group();
        WebbingMasterR.name = "WebbingMasterR";
        WebbingMasterR.position.x = (params.width / 2) - trussGapFromWall;
        scene.add(WebbingMasterR);
      }
      if (typeof scene.getObjectByName('WebbingRoofMasterL') == 'undefined') {
        var WebbingRoofMasterL = new THREE.Group();
        WebbingRoofMasterL.name = "WebbingRoofMasterL";
        WebbingRoofMasterL.position.set(((params.width / -2) + trussGapFromWall + trussTangentWidth), trussHeightL - trussTangentHeightL, 0);
        WebbingRoofMasterL.rotation.z = -pitchRadiansL;
        scene.add(WebbingRoofMasterL);
      }
      if (typeof scene.getObjectByName('WebbingRoofMasterR') == 'undefined') {
        var WebbingRoofMasterR = new THREE.Group();
        WebbingRoofMasterR.name = "WebbingRoofMasterR";
        WebbingRoofMasterR.position.set(((params.width / 2) - trussGapFromWall - trussTangentWidth), trussHeightR - trussTangentHeightR, 0);
        WebbingRoofMasterR.rotation.z = pitchRadiansR;
        scene.add(WebbingRoofMasterR);
      }
      if (typeof scene.getObjectByName('WebbingMasterL') != 'undefined') {
        var Y = 0;
        var triBaseLength = trussFootingWidth;
        var triObtuseAngle = Math.abs(trussWallInnerAngleL) + (Math.PI / 2);
        var P = (Math.PI / 180 * 33.3);
        var P2 = Math.PI - P;
        var L = ((triBaseLength / Math.sin(Math.PI - P - triObtuseAngle)) * Math.sin(triObtuseAngle));
        while (Y < trussHeightL - trussTangentHeightL) {
          WebbingClone = scene.getObjectByName('Webbing').clone();
          WebbingClone.name = "WebbingClone";
          WebbingClone.position.y = Y;
          WebbingClone.scale.y = L;
          if (trussHeightL - trussTangentHeightL < Y + (Math.sqrt(Math.pow(L, 2) - Math.pow(trussTangentWidth, 2)))) {
            WebbingClone.rotation.z = Math.atan((trussHeightL - trussTangentHeightL - Y) / trussTangentWidth) - (Math.PI / 2);
            WebbingClone.scale.y = Math.sqrt(Math.pow(trussTangentWidth, 2) + Math.pow((trussHeightL - trussTangentHeightL - Y), 2));
          } else {
            WebbingClone.rotation.z = P - (Math.PI / 2);
          }
          WebbingClone.visible = true;
          scene.getObjectByName('WebbingMasterL').add(WebbingClone);
          Y = Y + (((L / Math.sin(Math.PI / 2)) * Math.sin(P)) * 2);
          if (Y < trussHeightL) {
            WebbingClone = scene.getObjectByName('Webbing').clone();
            WebbingClone.name = "WebbingClone";
            WebbingClone.position.y = Y;
            WebbingClone.scale.y = L;
            WebbingClone.rotation.z = P2 + (Math.PI / 2);
            WebbingClone.visible = true;
            scene.getObjectByName('WebbingMasterL').add(WebbingClone);
          }
          triBaseLength = (L / Math.sin(Math.PI - triObtuseAngle)) * Math.sin(triObtuseAngle - P);
          L = ((triBaseLength / Math.sin(Math.PI - P - triObtuseAngle)) * Math.sin(triObtuseAngle));
        }
      }
      if (typeof scene.getObjectByName('WebbingMasterR') != 'undefined') {
        var Y = 0;
        var triBaseLength = trussFootingWidth;
        var triObtuseAngle = Math.abs(trussWallInnerAngleR) + (Math.PI / 2);
        var P = (Math.PI / 180 * 33.3);
        var P2 = Math.PI - P;
        var L = ((triBaseLength / Math.sin(Math.PI - P - triObtuseAngle)) * Math.sin(triObtuseAngle));
        while (Y < trussHeightR - trussTangentHeightR) {
          WebbingClone = scene.getObjectByName('Webbing').clone();
          WebbingClone.name = "WebbingClone";
          WebbingClone.position.y = Y;
          WebbingClone.scale.y = L;
          if (trussHeightR - trussTangentHeightR < Y + (Math.sqrt(Math.pow(L, 2) - Math.pow(trussTangentWidth, 2)))) {
            WebbingClone.rotation.z = -Math.atan((trussHeightR - trussTangentHeightR - Y) / trussTangentWidth) + (Math.PI / 2);
            WebbingClone.scale.y = Math.sqrt(Math.pow(trussTangentWidth, 2) + Math.pow((trussHeightR - trussTangentHeightR - Y), 2));
          } else {
            WebbingClone.rotation.z = -P + (Math.PI / 2);
          }
          WebbingClone.visible = true;
          scene.getObjectByName('WebbingMasterR').add(WebbingClone);
          Y = Y + (((L / Math.sin(Math.PI / 2)) * Math.sin(P)) * 2);
          if (Y < trussHeightR) {
            WebbingClone = scene.getObjectByName('Webbing').clone();
            WebbingClone.name = "WebbingClone";
            WebbingClone.position.y = Y;
            WebbingClone.scale.y = L;
            WebbingClone.rotation.z = -P2 - (Math.PI / 2);
            WebbingClone.visible = true;
            scene.getObjectByName('WebbingMasterR').add(WebbingClone);
          }
          triBaseLength = (L / Math.sin(Math.PI - triObtuseAngle)) * Math.sin(triObtuseAngle - P);
          L = ((triBaseLength / Math.sin(Math.PI - P - triObtuseAngle)) * Math.sin(triObtuseAngle));
        }
        ;
      }
      if (typeof scene.getObjectByName('WebbingRoofMasterL') != 'undefined') {
        var Y = 0;
        var triBaseLength = trussFootingWidth;
        var triObtuseAngle = Math.abs(trussWallInnerAngleL) + (Math.PI / 2);
        var P = (Math.PI / 2) + (Math.PI / 180 * 33.3);
        var L = trussRoofRailSpacing / Math.sin(P);
        var upperTrussAddOn = Math.sqrt(Math.pow(trussTangentLengthL, 2) - Math.pow(trussRoofRailSpacing, 2));
        var upperTrussLeftOver = trussRoofOuterLengthL - trussRoofInnerLengthL - upperTrussAddOn;
        while (Y < trussRoofInnerLengthL) {
          WebbingClone = scene.getObjectByName('Webbing').clone();
          WebbingClone.name = "WebbingClone";
          WebbingClone.position.y = Y;
          WebbingClone.scale.y = L;
          if (Y + upperTrussAddOn + (Math.sqrt(Math.pow(L, 2) - Math.pow(trussRoofRailSpacing, 2))) < trussRoofOuterLengthL) {
            WebbingClone.rotation.z = Math.PI - P;
          } else {
            var remainingDistance = trussRoofOuterLengthL - upperTrussAddOn - Y;
            WebbingClone.rotation.z = (Math.PI / 2) - Math.atan(remainingDistance / trussRoofRailSpacing);
            WebbingClone.scale.y = Math.sqrt(Math.pow(trussRoofRailSpacing, 2) + Math.pow((remainingDistance), 2));
            Y = Y + 100;
          }
          WebbingClone.visible = true;
          scene.getObjectByName('WebbingRoofMasterL').add(WebbingClone);
          Y = Y + ((Math.sqrt(Math.pow(L, 2) - Math.pow(trussRoofRailSpacing, 2))) * 2);
          WebbingClone = scene.getObjectByName('Webbing').clone();
          WebbingClone.name = "WebbingClone";
          WebbingClone.position.y = Y;
          if (Y < trussRoofInnerLengthL) {
            WebbingClone.scale.y = L;
            WebbingClone.rotation.z = P;
          } else if (Y < trussRoofInnerLengthL + 5) {
            WebbingClone.position.y = trussRoofInnerLengthL;
            var remainingDistance = trussRoofInnerLengthL - Y + (Math.sqrt(Math.pow(L, 2) - Math.pow(trussRoofRailSpacing, 2)));
            if (remainingDistance > 0) {
              WebbingClone.rotation.z = Math.PI - Math.atan(trussRoofRailSpacing / remainingDistance);
            } else {
              WebbingClone.rotation.z = Math.atan(trussRoofRailSpacing / Math.abs(remainingDistance));
            }
            WebbingClone.scale.y = Math.sqrt(Math.pow(trussRoofRailSpacing, 2) + Math.pow((remainingDistance), 2));
          }
          WebbingClone.visible = true;
          scene.getObjectByName('WebbingRoofMasterL').add(WebbingClone);
        }
      }
      if (typeof scene.getObjectByName('WebbingRoofMasterR') != 'undefined') {
        var Y = 0;
        var triBaseLength = trussFootingWidth;
        var triObtuseAngle = Math.abs(trussWallInnerAngleR) + (Math.PI / 2);
        var P = (Math.PI / 2) + (Math.PI / 180 * 33.3);
        var L = trussRoofRailSpacing / Math.sin(P);
        var upperTrussAddOn = Math.sqrt(Math.pow(trussTangentLengthR, 2) - Math.pow(trussRoofRailSpacing, 2));
        var upperTrussLeftOver = trussRoofOuterLengthR - trussRoofInnerLengthR - upperTrussAddOn;
        while (Y < trussRoofInnerLengthR) {
          WebbingClone = scene.getObjectByName('Webbing').clone();
          WebbingClone.name = "WebbingClone";
          WebbingClone.position.y = Y;
          WebbingClone.scale.y = L;
          if (Y + upperTrussAddOn + (Math.sqrt(Math.pow(L, 2) - Math.pow(trussRoofRailSpacing, 2))) < trussRoofOuterLengthR) {
            WebbingClone.rotation.z = -Math.PI + P;
          } else {
            var remainingDistance = trussRoofOuterLengthR - upperTrussAddOn - Y;
            WebbingClone.rotation.z = (Math.PI / -2) + Math.atan(remainingDistance / trussRoofRailSpacing);
            WebbingClone.scale.y = Math.sqrt(Math.pow(trussRoofRailSpacing, 2) + Math.pow((remainingDistance), 2));
            Y = Y + 100;
          }
          WebbingClone.visible = true;
          scene.getObjectByName('WebbingRoofMasterR').add(WebbingClone);
          Y = Y + ((Math.sqrt(Math.pow(L, 2) - Math.pow(trussRoofRailSpacing, 2))) * 2);
          WebbingClone = scene.getObjectByName('Webbing').clone();
          WebbingClone.name = "WebbingClone";
          WebbingClone.position.y = Y;
          if (Y < trussRoofInnerLengthR) {
            WebbingClone.scale.y = L;
            WebbingClone.rotation.z = -P;
          } else if (Y < trussRoofInnerLengthR + 5) {
            WebbingClone.position.y = trussRoofInnerLengthR;
            var remainingDistance = trussRoofInnerLengthR - Y + (Math.sqrt(Math.pow(L, 2) - Math.pow(trussRoofRailSpacing, 2)));
            if (remainingDistance > 0) {
              WebbingClone.rotation.z = -Math.PI + Math.atan(trussRoofRailSpacing / remainingDistance);
            } else {
              WebbingClone.rotation.z = -Math.atan(trussRoofRailSpacing / Math.abs(remainingDistance));
            }
            WebbingClone.scale.y = Math.sqrt(Math.pow(trussRoofRailSpacing, 2) + Math.pow((remainingDistance), 2));
          }
          WebbingClone.visible = true;
          scene.getObjectByName('WebbingRoofMasterR').add(WebbingClone);
        }
      }
      scene.getObjectByName('TrussMasterR').traverse(function(child) {
        if (child instanceof THREE.Group) {
          if (child.name === 'TrussTangent') {
            child.position.set(0, trussHeightL, 0);
            child.rotation.z = trussTangentAngleR - (Math.PI / 2);
            child.scale.x = trussTangentLengthR;
          }
        } else if (child instanceof THREE.Mesh) {
          if (child.name === 'TrussWallOuter') {
            child.scale.z = trussHeightR;
          }
          if (child.name === 'TrussWallInner') {
            child.scale.z = trussWallInnerLengthR;
            child.rotation.y = trussWallInnerAngleR;
          }
          if (child.name === 'TrussRoofOuter') {
            child.scale.z = trussRoofOuterLengthR;
            child.position.y = trussHeightR;
            child.rotation.y = pitchRadiansR;
          }
          if (child.name === 'TrussRoofInner') {
            child.scale.z = trussRoofInnerLengthR;
            child.position.x = trussTangentWidth;
            child.position.y = trussHeightR - trussTangentHeightR;
            child.rotation.y = pitchRadiansR;
          }
          if (child.name === 'TrussKeystone') {
            child.scale.z = trussKeystoneLengthR;
            child.position.set(child.parent.position.x - trussAsymmetry, positionY - 0.6, 0);
          }
        }
      });
      var TrussClones = new THREE.Group();
      TrussClones.name = "TrussClones";
      scene.add(TrussClones);
      for (var i = 1; i < params.depth / 2 / 12; i++) {
        TrussClone = scene.getObjectByName('TrussMasterL').clone();
        TrussClone.name = "TrussClone";
        TrussClone.position.z = i * 12;
        TrussClones.add(TrussClone);
        TrussClone2 = scene.getObjectByName('TrussMasterL').clone();
        TrussClone2.name = "TrussClone";
        TrussClone2.position.z = i * -12;
        TrussClones.add(TrussClone2);
        TrussClone = scene.getObjectByName('TrussMasterR').clone();
        TrussClone.name = "TrussClone";
        TrussClone.position.z = i * 12;
        TrussClones.add(TrussClone);
        TrussClone2 = scene.getObjectByName('TrussMasterR').clone();
        TrussClone2.name = "TrussClone";
        TrussClone2.position.z = i * -12;
        TrussClones.add(TrussClone2);
        WebbingClone = scene.getObjectByName('WebbingMasterL').clone();
        WebbingClone.name = "WebbingClone";
        WebbingClone.position.z = i * 12;
        TrussClones.add(WebbingClone);
        WebbingClone = scene.getObjectByName('WebbingMasterL').clone();
        WebbingClone.name = "WebbingClone";
        WebbingClone.position.z = i * -12;
        TrussClones.add(WebbingClone);
        WebbingClone = scene.getObjectByName('WebbingMasterR').clone();
        WebbingClone.name = "WebbingClone";
        WebbingClone.position.z = i * 12;
        TrussClones.add(WebbingClone);
        WebbingClone = scene.getObjectByName('WebbingMasterR').clone();
        WebbingClone.name = "WebbingClone";
        WebbingClone.position.z = i * -12;
        TrussClones.add(WebbingClone);
        WebbingClone = scene.getObjectByName('WebbingRoofMasterL').clone();
        WebbingClone.name = "WebbingClone";
        WebbingClone.position.z = i * 12;
        TrussClones.add(WebbingClone);
        WebbingClone = scene.getObjectByName('WebbingRoofMasterL').clone();
        WebbingClone.name = "WebbingClone";
        WebbingClone.position.z = i * -12;
        TrussClones.add(WebbingClone);
        WebbingClone = scene.getObjectByName('WebbingRoofMasterR').clone();
        WebbingClone.name = "WebbingClone";
        WebbingClone.position.z = i * 12;
        TrussClones.add(WebbingClone);
        WebbingClone = scene.getObjectByName('WebbingRoofMasterR').clone();
        WebbingClone.name = "WebbingClone";
        WebbingClone.position.z = i * -12;
        TrussClones.add(WebbingClone);
      }
      TrussClone = scene.getObjectByName('TrussMasterL').clone();
      TrussClone.name = "TrussClone";
      TrussClone.position.z = params.depth / 2 - trussGapFromWall - 0.25;
      TrussClones.add(TrussClone);
      TrussClone2 = scene.getObjectByName('TrussMasterL').clone();
      TrussClone2.name = "TrussClone";
      TrussClone2.position.z = params.depth / -2 + trussGapFromWall + 0.25;
      TrussClones.add(TrussClone2);
      WebbingClone = scene.getObjectByName('WebbingMasterL').clone();
      WebbingClone.name = "WebbingClone";
      WebbingClone.position.z = params.depth / 2 - trussGapFromWall - 0.25;
      TrussClones.add(WebbingClone);
      WebbingClone = scene.getObjectByName('WebbingMasterL').clone();
      WebbingClone.name = "WebbingClone";
      WebbingClone.position.z = params.depth / -2 + trussGapFromWall + 0.25;
      TrussClones.add(WebbingClone);
      WebbingClone = scene.getObjectByName('WebbingRoofMasterL').clone();
      WebbingClone.name = "WebbingClone";
      WebbingClone.position.z = params.depth / 2 - trussGapFromWall - 0.25;
      TrussClones.add(WebbingClone);
      WebbingClone = scene.getObjectByName('WebbingRoofMasterL').clone();
      WebbingClone.name = "WebbingClone";
      WebbingClone.position.z = params.depth / -2 + trussGapFromWall + 0.25;
      TrussClones.add(WebbingClone);
      TrussClone = scene.getObjectByName('TrussMasterR').clone();
      TrussClone.name = "TrussClone";
      TrussClone.position.z = params.depth / 2 - trussGapFromWall - 0.25;
      TrussClones.add(TrussClone);
      TrussClone2 = scene.getObjectByName('TrussMasterR').clone();
      TrussClone2.name = "TrussClone";
      TrussClone2.position.z = params.depth / -2 + trussGapFromWall + 0.25;
      TrussClones.add(TrussClone2);
      WebbingClone = scene.getObjectByName('WebbingMasterR').clone();
      WebbingClone.name = "WebbingClone";
      WebbingClone.position.z = params.depth / 2 - trussGapFromWall - 0.25;
      TrussClones.add(WebbingClone);
      WebbingClone = scene.getObjectByName('WebbingMasterR').clone();
      WebbingClone.name = "WebbingClone";
      WebbingClone.position.z = params.depth / -2 + trussGapFromWall + 0.25;
      TrussClones.add(WebbingClone);
      WebbingClone = scene.getObjectByName('WebbingRoofMasterR').clone();
      WebbingClone.name = "WebbingClone";
      WebbingClone.position.z = params.depth / 2 - trussGapFromWall - 0.25;
      TrussClones.add(WebbingClone);
      WebbingClone = scene.getObjectByName('WebbingRoofMasterR').clone();
      WebbingClone.name = "WebbingClone";
      WebbingClone.position.z = params.depth / -2 + trussGapFromWall + 0.25;
      TrussClones.add(WebbingClone);
      scene.remove(scene.getObjectByName('FramingParent'));
      scene.remove(scene.getObjectByName('FramingParentRoofL'));
      scene.remove(scene.getObjectByName('FramingParentRoofR'));
      if (params.secondaryMembers === 'Wood') {
        scene.getObjectByName('Framing').material.color.setHex(0xBCAA7D);
        scene.getObjectByName('Framing').material.specular.setHex(0x525049);
        scene.getObjectByName('Framing').material.shininess.value = 15;
      } else {
        scene.getObjectByName('Framing').material.color.setHex(0x999999);
        scene.getObjectByName('Framing').material.specular.setHex(0x3C3C3C);
        scene.getObjectByName('Framing').material.shininess.value = 40;
      }
      var FramingParent = new THREE.Group();
      FramingParent.name = "FramingParent";
      scene.add(FramingParent);
      var FramingParentRoofL = new THREE.Group();
      FramingParentRoofL.name = "FramingParentRoofL";
      FramingParentRoofL.position.set(((params.width / -2) + trussGapFromWall), trussHeightL, 0);
      FramingParentRoofL.rotation.z = (Math.PI / 2) - pitchRadiansL;
      scene.add(FramingParentRoofL);
      var FramingParentRoofR = new THREE.Group();
      FramingParentRoofR.name = "FramingParentRoofR";
      FramingParentRoofR.position.set(((params.width / 2) - trussGapFromWall), trussHeightL, 0);
      FramingParentRoofR.rotation.z = pitchRadiansR - (Math.PI / -2);
      scene.add(FramingParentRoofR);
      scene.getObjectByName('Framing').scale.set(1, 1, params.depth - 0.25);
      var i = 0;
      while (i < hypotenuseLengthL / 2) {
        var clonedObject = scene.getObjectByName('Framing').clone();
        clonedObject.position.set(i * 2, trussGapFromWall / 2, 0);
        clonedObject.rotation.z = Math.PI / 2;
        clonedObject.visible = true;
        FramingParentRoofL.add(clonedObject);
        i++;
      }
      var i = 0;
      while (i < hypotenuseLengthR / 2) {
        var clonedObject = scene.getObjectByName('Framing').clone();
        clonedObject.position.set(i * 2, -trussGapFromWall / 2, 0);
        clonedObject.rotation.z = Math.PI / 2;
        clonedObject.visible = true;
        FramingParentRoofR.add(clonedObject);
        i++;
      }
      var i = 0;
      while (i < MaxWallHeight / 2) {
        if (i < wallHeightL / 2) {
          var clonedObject = scene.getObjectByName('Framing').clone();
          clonedObject.position.set((params.width / -2) + (trussGapFromWall / 1.9), (i * 2) + 0.05, 0);
          clonedObject.visible = true;
          FramingParent.add(clonedObject);
        }
        if (i < wallHeightR / 2) {
          var clonedObject = scene.getObjectByName('Framing').clone();
          clonedObject.scale.z = params.depth - 0.25;
          clonedObject.position.set((params.width / 2) - (trussGapFromWall / 1.9), (i * 2) + 0.05, 0);
          clonedObject.visible = true;
          FramingParent.add(clonedObject);
        }
        if (i < params.height / 2) {
          var clonedObject = scene.getObjectByName('Framing').clone();
          clonedObject.position.set(0, (i * 2) + 0.05, (params.depth / -2) + (trussGapFromWall / 1.9));
          clonedObject.rotation.y = Math.PI / 2;
          clonedObject.scale.z = params.width - 0.25;
          clonedObject.visible = true;
          FramingParent.add(clonedObject);
          var clonedObject = scene.getObjectByName('Framing').clone();
          clonedObject.position.set(0, (i * 2) + 0.05, (params.depth / 2) - (trussGapFromWall / 1.9));
          clonedObject.rotation.y = Math.PI / 2;
          clonedObject.scale.z = params.width - 0.25;
          clonedObject.visible = true;
          FramingParent.add(clonedObject);
        }
        i++;
      }
      while (i < ((height + params.height) - roofHeightAdjustment) / 2) {
        var currentPeakAreaHeight = ((i * 2) - params.height);
        if (params.roofType === 'Single Slope') {} else if (params.roofType === 'Asymmetrical') {
          widthL = widthL;
          widthR = widthR;
          pitchRadiansL = pitchRadiansL;
          pitchRadiansR = pitchRadiansR;
          framePosX = currentPeakAreaHeight / height * params.asymmetrical;
        } else {
          widthL = params.width / 2;
          widthR = params.width / 2;
          pitchRadiansL = pitchRadians;
          pitchRadiansR = pitchRadians;
          framePosX = 0;
        }
        var frameLengthL = widthL - ((currentPeakAreaHeight + 0.5) / (Math.tan(Math.PI / 2 - pitchRadiansL)));
        var frameLengthR = widthR - ((currentPeakAreaHeight + 0.5) / (Math.tan(Math.PI / 2 - pitchRadiansR)));
        var clonedObject = scene.getObjectByName('Framing').clone();
        clonedObject.position.set(framePosX, (i * 2) + 0.05, (params.depth / -2) + (trussGapFromWall / 1.9));
        clonedObject.rotation.y = Math.PI / 2;
        clonedObject.scale.z = frameLengthL + frameLengthR - 0.25;
        clonedObject.visible = true;
        FramingParent.add(clonedObject);
        var clonedObject = scene.getObjectByName('Framing').clone();
        clonedObject.position.set(framePosX, (i * 2) + 0.05, (params.depth / 2) - (trussGapFromWall / 1.9));
        clonedObject.rotation.y = Math.PI / 2;
        clonedObject.scale.z = frameLengthL + frameLengthR - 0.25;
        clonedObject.visible = true;
        FramingParent.add(clonedObject);
        i++;
      }
    }


    var colorTable = {
      // 200 series
      "Burnished Slate": "0x3c322c",
      "Polar White": "0xeaebe1",
      "Charcoal Gray": "0x4a4544",
      "Light Stone": "0xd5cba6",
      "Rustic Red": "0x7f2b24",
      "Koko Brown": "0x4d3530",
      "Fern Green": "0x21372d",
      "Coal Black": "0x121111",
      "Hawaiian Blue": "0x3d647d",
      // 300 series
      "Harbor Blue": "0x1c3d56",
      "Colonial Red": "0x652828",
      "Medium Bronze": "0x372b25",
      "Pacific Blue": "0x31556f",
      "Snow White": "0xe4eaed",
      "Slate Gray": "0x7f7f76",
      "Almond": "0xe5e0c5",
      "Midnight Bronze": "0x2b2d2b",
      "Everglade": "0x3e6c61",
      "Brownstone": "0xa0906c",
      "Tundra": "0x919a9d",
      "Spruce": "0x588371",
      "Scarlet Red": "0xa2162e",
      "Hunter Green": "0x233029",
      "Classic Green": "0x1f423e",
      "Natural Patina": "0x8fb785",
      "Copper Metallic": "0xa56744",
      "Silver Metallic": "0xcccadf",
      "Galvalume-Plus": "0xc3b9b6"
    };


    function updateColors() {
      scene.traverse(function(child) {
        if (child instanceof THREE.Mesh && (child.material.materials)) {
          for (var m = 0; m < child.material.materials.length; m++) {
            if (child.material.materials[m].name === 'BuildingRoof' || child.material.materials[m].name === 'CupolaRoof') {
              child.material.materials[m].color.setHex(colorTable[params.roofColor]);
            }
            if (child.material.materials[m].name === 'BuildingWallsWidthLeftFront' || child.material.materials[m].name === 'BuildingWallsWidthLeftBack' || child.material.materials[m].name === 'BuildingWallsWidthRightFront' || child.material.materials[m].name === 'BuildingWallsWidthRightBack' || child.material.materials[m].name === 'BuildingWallsDepth' || child.material.materials[m].name === 'BuildingWallsDepthL' || child.material.materials[m].name === 'BuildingWallsDepthR' || child.material.materials[m].name === 'BuildingWalls' || child.material.materials[m].name === 'LeantoWallsWidth' || child.material.materials[m].name === 'LeantoWallsDepth') {
              child.material.materials[m].color.setHex(colorTable[params.wallColor]);
            }
            if (child.material.materials[m].name === 'BuildingTrim' || child.material.materials[m].name === 'BuildingTrim1' || child.material.materials[m].name === 'BuildingTrim2' || child.material.materials[m].name === 'BuildingTrim3' || child.material.materials[m].name === 'BuildingTrim4' || child.material.materials[m].name === 'BuildingTrim-RoofEdge' || child.material.materials[m].name === 'BuildingTrim-RoofPivot' || child.material.materials[m].name === 'BuildingRidgeCap') {
              child.material.materials[m].color.setHex(colorTable[params.trimColor]);
            }
            if (child.material.materials[m].name === 'BuildingWainscot1' || child.material.materials[m].name === 'BuildingWainscot2' || child.material.materials[m].name === 'BuildingWainscot3' || child.material.materials[m].name === 'BuildingWainscot4' || child.material.materials[m].name === 'BuildingWainscotTrim1' || child.material.materials[m].name === 'BuildingWainscotTrim2' || child.material.materials[m].name === 'BuildingWainscotTrim3' || child.material.materials[m].name === 'BuildingWainscotTrim4' || child.material.materials[m].name === 'LeantoWainscot1' || child.material.materials[m].name === 'LeantoWainscot2' || child.material.materials[m].name === 'LeantoWainscot3' || child.material.materials[m].name === 'LeantoWainscotTrim1' || child.material.materials[m].name === 'LeantoWainscotTrim2' || child.material.materials[m].name === 'LeantoWainscotTrim3') {
              child.material.materials[m].color.setHex(colorTable[params.wainscotColor]);
            }
            if (child.material.materials[m].name === 'BuildingSoffit') {
              child.material.materials[m].color.setHex(colorTable[params.soffitColor]);
            }
          }
        }
      });
    }

    function condenseExpandParams(input, expand) {
      expand = expand || false;
      if (expand === false) {
        scene.traverse(function(child) {
          if (child instanceof THREE.Mesh) {

            width = parseFloat((width + (child.morphTargetInfluences[child.morphTargetDictionary['width']] * 10 * 2)).toFixed(2));
            height = parseFloat((height + (child.morphTargetInfluences[child.morphTargetDictionary['height']] * 10)).toFixed(2));
          }
        });
      }
      var condenseParamsList = {
        'width': 'w',
        'depth': 'd',
        'height': 'h',
        'roofType': 'rT',
        'asymmetrical': 'a',
        'roofPitch': 'rP',
        'secondaryMembers': 'sM',
        'roofColor': 'rC',
        'wallColor': 'wC',
        'trimColor': 'tC',
        'soffitColor': 'sC',
        'wainscotColor': 'waC',
        'wainscot1': 'wa1',
        'wainscot2': 'wa2',
        'wainscot3': 'wa3',
        'wainscot4': 'wa4',
        'gableFront': 'gF',
        'gableBack': 'gB',
        'eaveL': 'eL',
        'eavePitchL': 'ePL',
        'eaveSoffitL': 'eSL',
        'eaveR': 'eR',
        'eavePitchR': 'ePR',
        'eaveSoffitR': 'eSR',
        'halfTruss1Length': 'hT1L',
        'halfTruss1Depth': 'hT1D',
        'halfTruss1Height': 'hT1H',
        'halfTruss1Pitch': 'hT1P',
        'halfTruss2Length': 'hT2L',
        'halfTruss2Depth': 'hT2D',
        'halfTruss2Height': 'hT2H',
        'halfTruss2Pitch': 'hT2P',
        'halfTruss3Length': 'hT3L',
        'halfTruss3Depth': 'hT3D',
        'halfTruss3Height': 'hT3H',
        'halfTruss3Pitch': 'hT3P',
        'halfTruss4Length': 'hT4L',
        'halfTruss4Depth': 'hT4D',
        'halfTruss4Height': 'hT4H',
        'halfTruss4Pitch': 'hT4P',
        'halfTruss1': 'hT1',
        'halfTruss2': 'hT2',
        'halfTruss3': 'hT3',
        'halfTruss4': 'hT4'
      };
      if (expand == true) {
        $.each(condenseParamsList, function(key, value) {
          input = input.replace(new RegExp('&' + value + '=','g'), '&' + key + '=');
        });
      } else {
        $.each(condenseParamsList, function(key, value) {
          input = input.replace(new RegExp(key,'g'), value);
        });
        input = window.location.protocol + '//' + window.location.hostname + window.location.pathname + '?load=true&' + input;
      }
      return input;
    }

    var $select = $('select');
    $select.each(function () {
      $(this).addClass($(this).children(':selected').val());
    }).on('change', function (ev) {
      $(this).attr('class', '').addClass($(this).children(':selected').val());
    });
});
