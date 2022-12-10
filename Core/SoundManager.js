//https://www.w3schools.com/jsref/dom_obj_audio.asp
class SoundManager extends PIXI.utils.EventEmitter {

    // static _L2dAudioPlayer = new Live2dAudioPlayer()
    static instance = null
    constructor(){
        super()
        
        if(SoundManager.instance != this) {
            SoundManager.instance = this
        }

        // this._pixisound = PIXI.sound
        this._AudioMap = new Map()
        this._SEaudio = new Audio()
        this._BGMaudio = new Audio()
    }

    // async loadData(data){

    // }

    async play(type, src){
        if(type === 0 || type == 'BGM' || type == 'bgm'){
            return new Promise((res)=>{
                this._BGMaudio.src = src
                this._BGMaudio.load()
                this._BGMaudio.loop = true
                this._BGMaudio.volume = 0.6
                this._BGMaudio.play()  
                res()       
            })
        }

        if(type === 1 || type === 'SE' || type === 'se'){
            return new Promise((res)=>{
                this._SEaudio.src = src
                this._SEaudio.load()
                this._SEaudio.play()

                this._SEaudio.onended = () => {
                    res()
                }
            })
        }
    }

    mute(type, bool){
        if(type === 0 || type == 'BGM' || type == 'bgm'){
            this._BGMaudio.muted = bool
        }

        if(type === 1 || type === 'SE' || type === 'se'){
            this._SEaudio.muted = bool
        }
    }

    muteAll(bool){
        this._BGMaudio.muted = bool
        this._SEaudio.muted = bool
    }

    pause(type){
        if(type === 0 || type == 'BGM' || type == 'bgm'){
            this._BGMaudio.pause()
        }

        if(type === 1 || type === 'SE' || type === 'se'){
            this._SEaudio.pause()
        }
    }

    pauseAll(){
        this._BGMaudio.pause()
        this._SEaudio.pause()
    }

    // static get L2dAudioPlayer() {
    //     return this._L2dAudioPlayer
    // }


}