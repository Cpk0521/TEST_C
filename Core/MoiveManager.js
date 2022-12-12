class MoiveManager {

    _loader = PIXI.Assets
    constructor(){
        this._container = new PIXI.Container();
        this._container.visible = false

        this.movieMap = new Map()
    }

    async initialize(Assets){
        
    }   

    async show(){

    }

    async hide(){
        this._container.visible = false
    }

    get container() {
        return this._container
    }

}