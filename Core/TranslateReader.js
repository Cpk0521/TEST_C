var translate_src = 'https://raw.githubusercontent.com/Cpk0521/CueStoryResource/main/scenario/'

class TranslateReader extends PIXI.utils.EventEmitter {

    _loader = PIXI.Assets
    constructor(){
        super()

        this._messageLog = []
        this._language = []
        this._translator = []

        this._curr = -1
    }

    async initialize(type, id, phase, heroine){

        let src = ''
        switch (type) {
            case "Main":
                break;
            case "Event":
                break;
            case "Card":
                src = `${translate_src}/${type.toLowerCase()}/${type}_${heroine.toString().padStart(2, '0')}/${type}_${id}_${phase}.json`
                break;
            case "Link":
                break;
            case "Lesson":
                break;
        }

        return await this._loader.load(src).then(({Dialogue, Language, Translator})=>{
            this._messageLog = Dialogue
            this._language = Language
            this._translator = Translator
        })
    }

    next(Language = ''){
        this._curr += 1
        let log = this.getTranslateLog(this._curr)
        return {name : log.name[Language], message : log.message[Language]}
    }
    
    getTranslateLog(index){
        if(this._messageLog.length <= 1) {
            return undefined
        }

        return this._messageLog[index]
    }

    get MessageLog(){
        return this._messageLog
    }

    get Language() {
        return this._language
    }

    get Translator(){
        return this._translator
    }

}