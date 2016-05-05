
(function (window) {

    'use strict';


    var ax = 0;
    var ay = 0;
    var imgW = 120;
    var imgH = 120;
    var frame = 5;
    var startOffset = 90;
    var gameWidth = 480;
    var gameHeight = 800;

    var globalCfg = {
        imgCount: 1000,

        vRegionRange: 6.7,
        vRegionBase: 2.1,

        vMinRange: .5,
        vMinBase: .1,

        rRange: 2.1,
        rBase: .8
    };

    // 限制区域
    var w = gameWidth - startOffset * 2;
    var h = gameHeight - startOffset * 2;
    var wHalf = w / 2;
    var hHalf = h / 2;

    var _regionActive = {
        x: startOffset,
        y: startOffset,
        width: w,
        height: h,
        bottom: startOffset + h,
        right: startOffset + w,
        xCen: startOffset + wHalf,
        yCen: startOffset + hHalf,
        wHalf: wHalf,
        hHalf: hHalf
    };

    var imageArr = [];
    var imageStatusArr= [];

    var ImageStatus = function(){
        this.dx = Math.random() > .5 ? -1 : 1;
        this.dy = Math.random() > .5 ? 1 : -1;
        this.updateVelocity();
    };
    ImageStatus.prototype.updateVelocity = function () {
        this.vMin = globalCfg.vMinBase + globalCfg.vMinRange * Math.random();
        this.vRegion = globalCfg.vRegionBase + globalCfg.vRegionRange * Math.random();
        this.rDelta = (globalCfg.rBase + globalCfg.rRange * Math.random()) * (Math.random() > .5 ? 1 : -1);
    };

    var _countAdvance = 0;

    // 游戏对象
    var states = {
        preload: preload,
        create: create,
        update: update
    };
    var game = new Phaser.Game(gameHeight, gameWidth, Phaser.CANVAS, 'wrapper', states , true);

    function preload(){
        game.load.spritesheet('test', 'img/test.png', imgW, imgH);

        // 游戏居中
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        // 适应父元素的大小，但会保持游戏的宽高比例
        // game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        // //将游戏的大小重设成适合父容器的大小，而且并不会保持游戏的宽高比例
        // game.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;
        // 设置游戏区域的真实物理大小（Canvas element size）
        game.scale.setGameSize(gameWidth,gameHeight);
        // The edges on which to constrain the game Display/canvas in addition to the restrictions of the parent container
        game.scale.windowConstraints = {
            right: 'layout',
            bottom: 'layout'
        };
        game.scale.refresh();

        // 前端性能监控
        this.stats = new Stats();
        this.stats.setMode(0); // 0: fps, 1: ms, 2: mb
        // align top-left
        this.stats.domElement.style.position = 'absolute';
        this.stats.domElement.style.left = '0px';
        this.stats.domElement.style.top = '0px';
        document.body.appendChild(this.stats.domElement);
    }

    function create() {
        console.log('图片数目：', globalCfg.imgCount);
        for(var i = 0; i < globalCfg.imgCount; i++){
            addRdmImg();
        }
    }

    /**
     * 游戏的每一帧都会调用它，每秒60帧
     * @return {[type]} [description]
     */
    function update() {
        this.stats.begin();

        setImage();

        this.stats.end();
    }

    function addRdmImg() {
        var ax = _regionActive.x + _regionActive.width * Math.random();
        var ay = _regionActive.y + _regionActive.height * Math.random();
        var frame = Math.round(Math.random() * 5);
        var xoffset = frame * imgW;

        var img = game.add.image(ax, ay, 'test', frame);

        img.rotation = 360 * Math.random();
        imageArr.push(img);
        imageStatusArr.push(new ImageStatus());

    }

    function setImage() {
        ++_countAdvance;

        if (_countAdvance % 1 == 0) {
            var image;
            var control;
            var xTo;
            var yTo;
            var xOff;
            var yOff;

            for(var i = imageArr.length - 1;  i > -1; --i){
                image = imageArr[i];
                control = imageStatusArr[i];

                image.rotation += control.rDelta;

                xOff = control.dx *( control.vMin + control.vRegion * ( 1 - Math.abs( image.x - _regionActive.xCen ) / _regionActive.wHalf ));
                xTo = image.x + xOff;
                if( xTo > _regionActive.x && xTo < _regionActive.right ){
                    image.x = xTo;
                }else{
                    control.dx *= -1;
                    control.updateVelocity();
                }

                yOff = control.dy *( control.vMin + control.vRegion * (1 - Math.abs( image.y - _regionActive.yCen ) / _regionActive.hHalf ));
                yTo = image.y + yOff;

                if( yTo > _regionActive.y && yTo < _regionActive.bottom ){
                    image.y = yTo;
                }else{
                    control.dy *= -1;
                    control.updateVelocity();
                }

            }
        }
    }

})(window);
