class backgroundManager extends PIXI.utils.EventEmitter {


    constructor() {
        super()

        this._frontcontainer = new PIXI.Container();
        this._backcontainer = new PIXI.Container();

        this._bgMap = new Map()
    }

    async initialize(data) {
        if(!data) {
            return new Promise(()=>{})
        }

        return Promise.all(
            data.map( async (bg)=>{
                let src = `./Backgrounds/background${bg.id.toString().padStart(3,'0')}_${bg.subId}/base.png`
                return this._addBG(bg.id, bg.subId, src, )
            })
        )
        // .then(()=>{
        //     console.log(this._bgMap)
        // })
    }

    async execute(id, subid) {
        // this.emit('executed')
        return this._switchBG(id, subid)
    }

    update(dt){

    }

    async _addBG(id, subid, BG, json = {}){

        if(this._isExist(id, subid)){
            // throw new Error(`Background ${id}_${sub} already exists.`);
            return new Promise(()=>{})
        }

        let bgcontainer = new PIXI.Container();
        let bg_base = PIXI.Sprite.from(BG)

        let ratio = (GameApp.appSize.width / 1334)
        bg_base.width = 1334 * ratio
        bg_base.height = 750 * ratio
        // console.log(1334 * ratioX, 750 * ratioX)
        bg_base.anchor.set(0.5)
        bg_base.position.set(GameApp.appSize.width /2 , GameApp.appSize.height /2)
        bgcontainer.addChild(bg_base)

        //根據BG的json去合成背景
        // this._combineBG()

        this._bgMap.set(`${id}_${subid}`, bgcontainer)

        return Promise.resolve(bgcontainer)
    }

    async _switchBG(id , subid) {
        let new_bg = this._getBG(id, subid)

        if(!new_bg){
            throw new Error(`Background ${id}_${sub}  not found.`);
        }

        // this._backcontainer.removeChildren()
        // this._frontcontainer.removeChildren()

        // this._backcontainer.addChild(new_bg)

        return new Promise((res) => {
            this._backcontainer.removeChildren()
            this._frontcontainer.removeChildren()

            res(this._backcontainer.addChild(new_bg))
        })

    }

    _getBG(id, subid) {
        let bg = this._bgMap.get(`${id}_${subid}`)
        if(!bg){
            throw new Error(`Background ${id}_${subid} not found.`);
        }

        return bg;
    }

    _isExist(label){
        return this._bgMap.has(label)
    }

    _isExist(id, subid) {
        return this._bgMap.has(`${id}_${subid}`)
    }

    get frontcontainer() {
        return this._frontcontainer
    }

    get backcontainer() {
        return this._backcontainer
    }


}