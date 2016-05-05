
(function () {
    'use strict';

    var game = window.game = {
        width: 0,
        height: 0,

        asset: null,
        stage: null,
        ticker: null,
        state: null,

        init: function () {
            this.asset = new game.Asset();
            this.asset.on('complete', function (e){
                this.asset.off('complete');
                this.initStage();
            }.bind(this));
            this.asset.load();

        },

        initStage: function () {
            this.width = 480;
            this.height = 800;
            this.scale = 1;

            // 舞台
            this.stage = new Hilo.Stage({
                renderType:'canvas',
                container: document.body,
                width: this.width,
                height: this.height,
                scaleX: this.scale,
                scaleY: this.scale
            });

            // 启动计时器
            this.ticker = new Hilo.Ticker(60);
            this.ticker.addTick(this.stage);
            this.ticker.start();

            // 舞台更新
            this.stage.onUpdate = this.onUpdate.bind(this);

            this.initScene();
        },

        onUpdate: function (e) {
            // console.log('stage update');
        },

        initScene: function () {
            // 准备场景
            this.gameReadyScene = new game.ReadyScene({
                width: this.width,
                height: this.height,
                image: this.asset.sq
            }).addTo(this.stage);
            this.gameReadyScene.visible = true;
        }
    };

    // 资源加载
    var asset = game.Asset = Hilo.Class.create({
        Mixes: Hilo.EventMixin,

        queue: null,
        sq: null,

        load: function () {
            var resources = [
                {id:'sq', src:'./img/test.png'}
            ];

            this.queue = new Hilo.LoadQueue();
            this.queue.add(resources);
            this.queue.on('complete', this.onComplete.bind(this));
            this.queue.start();
        },

        onComplete: function () {
            this.sq = this.queue.get('sq').content;
            this.queue.off('complete');
            this.fire('complete');
        }
    });

    var globalCfg = {
        imgCount: 1000,

        vRegionRange: 6.7,
        vRegionBase: 2.1,

        vMinRange: .5,
        vMinBase: .1,

        rRange: 2.1,
        rBase: .8
    };

    var ImageStatus = Hilo.Class.create({

        constructor: function(){
            this.dx = Math.random() > .5 ? -1 : 1;
            this.dy = Math.random() > .5 ? 1 : -1;
            this.updateVelocity();
        },

        updateVelocity: function () {
            this.vMin = globalCfg.vMinBase + globalCfg.vMinRange * Math.random();
            this.vRegion = globalCfg.vRegionBase + globalCfg.vRegionRange * Math.random();
            this.rDelta = (globalCfg.rBase + globalCfg.rRange * Math.random()) * (Math.random() > .5 ? 1 : -1);
        }
    });

    // ready场景
    var ReadyScene = game.ReadyScene = Hilo.Class.create({
        Extends: Hilo.Container,

        imgWidth: 120,
        imgHeight: 120,

        startOffset: 90,

        _countAdvance: 0,

        imageArr: [],
        imageStatusArr: [],

        constructor: function(params){
            ReadyScene.superclass.constructor.call(this, params);
            this.init(params);
        },

        init: function(params){

            this.gameWidth = params.width;
            this.gameHeight = params.height;

            this.image = params.image;

            // 限制区域
            var w = this.gameWidth - this.startOffset * 2;
            var h = this.gameHeight - this.startOffset * 2;
            var wHalf = w / 2;
            var hHalf = h / 2;

            this._regionActive = {
                x: this.startOffset,
                y: this.startOffset,
                width: w,
                height: h,
                bottom: this.startOffset + h,
                right: this.startOffset + w,
                xCen: this.startOffset + wHalf,
                yCen: this.startOffset + hHalf,
                wHalf: wHalf,
                hHalf: hHalf
            };

            this.addRdmImgs();

            // 前端性能监控
            this.stats = new Stats();
            this.stats.setMode(0); // 0: fps, 1: ms, 2: mb
            // align top-left
            this.stats.domElement.style.position = 'absolute';
            this.stats.domElement.style.left = '0px';
            this.stats.domElement.style.top = '0px';
            document.body.appendChild(this.stats.domElement);
        },

        addRdmImgs: function () {
            console.log('图片数目：', globalCfg.imgCount);

            for(var i = 0; i < globalCfg.imgCount; i++){
                this.addRdmImg();
            }
        },

        addRdmImg: function() {
            var x = this._regionActive.x + this._regionActive.width * Math.random();
            var y = this._regionActive.y + this._regionActive.height * Math.random();
            var xoffset = Math.round(Math.random() * 3) * this.imgWidth;

            var sq = new Hilo.Bitmap({
                image: this.image,
                x: x,
                y: y,
                rotation: 360 * Math.random(),
                rect:[xoffset, 0, this.imgWidth, this.imgHeight]

            });
            this.imageArr.push(sq);
            this.imageStatusArr.push(new ImageStatus());

            this.addChild(sq);
        },

        onUpdate: function(e) {
            // console.log('scene update');
            this.stats.begin();

            this.setImage();

            this.stats.end();

        },

        setImage: function () {
            ++this._countAdvance;

            if (this._countAdvance % 1 == 0) {
                var image;
                var control;
                var xTo;
                var yTo;
                var xOff;
                var yOff;

                for(var i = this.imageArr.length - 1;  i > -1; --i){
                    image = this.imageArr[i];
                    control = this.imageStatusArr[i];

                    image.rotation += control.rDelta;

                    xOff = control.dx *( control.vMin + control.vRegion * ( 1 - Math.abs( image.x - this._regionActive.xCen ) / this._regionActive.wHalf ));
                    xTo = image.x + xOff;
                    if( xTo > this._regionActive.x && xTo < this._regionActive.right ){
                        image.x = xTo;
                    }else{
                        control.dx *= -1;
                        control.updateVelocity();
                    }

                    yOff = control.dy *( control.vMin + control.vRegion * (1 - Math.abs( image.y - this._regionActive.yCen ) / this._regionActive.hHalf ));
                    yTo = image.y + yOff;

                    if( yTo > this._regionActive.y && yTo < this._regionActive.bottom ){
                        image.y = yTo;
                    }else{
                        control.dy *= -1;
                        control.updateVelocity();
                    }

                }
            }
        }
    });

    window.onload = function () {
        game.init();
    };

})();
