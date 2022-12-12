class ScenarioReader extends PIXI.utils.EventEmitter {

    static instance = null
    _loader = PIXI.Assets

    constructor(gameapp, config){
        super()

        if(ScenarioReader.instance != this) {
            ScenarioReader.instance = this
        }

        //loading screen

        //Adv Managers and Contrller
        this._gameapp = gameapp
        this._L2dManager = new Live2dManager()
        this._BGManager = new backgroundManager()
        this._MessageManager = new MessageManager()
        this._StillManager = new StillManager()
        this._MovieManager = new MoiveManager()
        this._SoundManager = new SoundManager()
        this._TranslateReader = new TranslateReader()
        this._MiscManager = new MiscManager()

        //add to main Container 
        this._gameapp.mainContainer.addChild(
            this._BGManager.backcontainer,
            this._L2dManager.container,
            this._BGManager.frontcontainer,
            this._StillManager.container,
            this._MessageManager.container,
            this._MovieManager.container,
            this._MiscManager.container
        )
        
        //scenario Detail
        this._StoryType = ''
        this._StoryId = ''
        this._StoryPhase = 0
        this._StoryHeroine = 0
        this._Storytitle = ''
        this._CommandSet = []

        //Command Counter
        this._current = -1
        this._commIndex = -1
        this._autoplay = true

        //Loading Screen
        this._isLoading = true

        //Translate
        this._isTranslate = true
        this._TranLang = 'zh'

        this.emit('ReaderOnCreated')
    }

    static create(gameapp, config) {
        return new this(gameapp, config)
    }

    static loadMasterList(masterlist){
        return this.instance?._loadMasterList(masterlist)
    }

    async _loadMasterList(masterlist) {

        let {storyType, storyID, phase, heroineId, title, mainCommands, Assets} = await this._loader.load(masterlist)

        this._StoryType = storyType
        this._StoryId = storyID
        this._StoryPhase = phase
        this._StoryHeroine = heroineId
        this._Storytitle = title
        this._CommandSet = mainCommands        

        console.log(this._checkHeroSort())

        return Promise.all([
            this._L2dManager.initialize(Assets.heroines, this._checkHeroSort()),
            this._BGManager.initialize(Assets.backgrounds),
            this._MessageManager.initialize(Assets.heroines),
            this._MovieManager.initialize(Assets.movieNames),
            new Promise((res)=>{
                this._isTranslate ? res(this._TranslateReader.initialize(storyType, storyID, phase, heroineId)) : res()
            })
        ]).then(async ()=>{
            this.emit('AssestsOnSetUp')
            this._waitingTouch()
        })
    }

    async _waitingTouch(){
        this._isLoading = false

        let touchToStartimg = await this._loader.load('./Images/ui/Common_TouchScreenText.png')
        let touchToStart = new PIXI.Sprite(touchToStartimg);
        this._gameapp.mainContainer.addChild(touchToStart)

        touchToStart.anchor.set(0.5);
        touchToStart.position.set(GameApp.appSize.width / 2  , GameApp.appSize.height / 2);
        
        const callback = ()=>{
            this._gameapp.mainContainer.removeChild(touchToStart)
            GameApp.App.view.removeEventListener('click', callback)
            GameApp.App.view.removeEventListener('touchstart', callback)
            this.start()
        }

        GameApp.App.view.addEventListener('click', callback);
        GameApp.App.view.addEventListener('touchstart', callback);
    }   


    async start(){
        console.log('start')

        if(!this._CommandSet){
            return
        }
        
        // this.next()

        for (let index = 0; index < this._CommandSet.length; index++) {
            let _curr = this._CommandSet[index];
            this._current = index
            this._commIndex = _curr.index
            // console.log(index, _curr.index)
            await this._render(_curr)            
        }

        if((this._current + 1) >= this._CommandSet?.length) {
            this._finish()
        }

    }

    async next(){

        this._gameapp.mainContainer.removeAllListeners()
        this._gameapp.mainContainer.cursor = ''

        if((this._current + 1) >= this._CommandSet?.length) {
            this._finish()
        }

        for (let index = this._current + 1; index < this._CommandSet.length; index++) {
            let _curr = this._CommandSet[index];
            this._current = index
            this._commIndex = _curr.index
            await this._render(_curr)

            if(_curr.commandType == 4 || _curr.commandType == 5 || _curr.commandType == 7 || _curr.commandType == 10) {
                break
            }
        }

        this._gameapp.mainContainer.on('click', ()=>this.next())
        this._gameapp.mainContainer.on('touchstart', () => this.next());
        this._gameapp.mainContainer.cursor = 'pointer'
    }

    _jumpTo(index){
        let i = index > this._commIndex ? this._current + 1 : 0
        for (i; i < this._CommandSet.length; i++) {
            if(this._CommandSet[i].index == index) {
                break;
            }
        }
        return {command : this._CommandSet[i], index : i}
    }

    _finish() {
        console.log('故事完結')
    }

    async destroy(){
        console.log('destory')
    }

    async _render(command) {
        return await new Promise((resolve) => {
            setTimeout(async()=>{
                let {priority, executes, waiting} = this._loadCommand(command)
                await Promise.all(priority.map(task => task()))
                await Promise.all(executes.map(task => task()))
                await this.delay(waiting)
                resolve()
            }, (command.time * 1000)) 
        })
    }

    _loadCommand(command){
        let {index, commandType, subCommands, values, commandParams, time, id, ...content} = command

        let _priority = []
        let _executes = []
        let _waiting = 0

        if(subCommands?.length > 0) {
            subCommands?.map((sub)=>{
                let sub_com = this._loadCommand(sub)
                _priority = _priority.concat(sub_com.priority)
                _executes = _executes.concat(sub_com.executes)
                _waiting += sub_com.waiting
            })
        }


        if(commandType == 1){
            // console.log(index, '背景')
            _executes.push(() => this._BGManager.execute(values[0], values[1]))
            // _executes.push(() => this._SoundManager.play('BGM', `./Audio/BGM/${values[2].toString().padStart(3, '0')}.mp3`))
        }
        else if(commandType == 2){
            console.log(index, '故事完結')
        }
        else if(commandType == 3){
            // console.log(index, '匯入live2d')
            //已在L2dManager loadData時 匯入了
            // executes.push(this._L2dManager.ADDToApp(id))
        }
        else if(commandType == 4){
            // console.log(index, '說話')
            let {message, rates} = content

            _priority.push(() => this._L2dManager.loadAudio(ResourcePath.getAudioSrc(values[0], this._StoryType, this._StoryId, this._StoryPhase, this._StoryHeroine)))
            _executes.push(() => this._L2dManager.speaking(id, rates))

            let tran_message = this._isTranslate ? this._TranslateReader.next(this._TranLang): undefined

            if(tran_message != undefined) {
                _executes.push(() => this._MessageManager.singleShow(id, tran_message.message, tran_message.name))
            }else{
                _executes.push(() => this._MessageManager.singleShow(id, message))
            }

            _waiting = 1000
        }
        else if(commandType == 5){
            // console.log(index, 'マネージャー說話')
            let {message} = content
            
            let tran_message = this._isTranslate ? this._TranslateReader.next(this._TranLang): undefined
            
            if(tran_message != undefined) {
                _executes.push(() => this._MessageManager.singleShow(id, tran_message.message, tran_message.name))
            }else{
                _executes.push(() => this._MessageManager.singleShow(id, message, 'マネージャー'))
            }

            _waiting = 2000
        }
        else if(commandType == 6){
            // console.log(index, '別人說話')
            let {name, message} = content
            let tran_message = this._isTranslate ? this._TranslateReader.next(this._TranLang): undefined

            if(tran_message != undefined) {
                _executes.push(() => this._MessageManager.singleShow(100, tran_message.message, tran_message.name))
            }else{
                _executes.push(() => this._MessageManager.singleShow(100, message, name))
            }

            _waiting = 2000
        }
        else if(commandType == 7){
            // console.log(index, 'audition選擇題')
            // audition
        }
        else if(commandType == 8){
            // console.log(`===========小節結束${index}===========`)
            // console.log(index, '小節')
        }
        else if(commandType == 9){
            // console.log(index, '轉場+轉背景')
            _executes.push(() => this._BGManager.execute(values[0], values[1]))
        }
        else if(commandType == 10){
            // console.log(index, '多人說話')
            let {multiHeroineParams, message} = content
            let tran_message = this._isTranslate ? this._TranslateReader.next(this._TranLang): undefined

            if(tran_message != undefined) {
                _executes.push(() => this._MessageManager.multiShow(multiHeroineParams, tran_message.message))
            }else{
                _executes.push(() => this._MessageManager.multiShow(multiHeroineParams, message))
            }

            _waiting = 2000

        }

        else if(commandType == 11){
            // console.log(index, 'live2d出場')
            let {fadeTime, rates} = content

            //優先處理
            _priority.push(async () => {
                await this._L2dManager.action(id, {
                    motion : values[0],
                    expression : values[1],
                    facing : values[2],
                }, true)
                await this.delay(500)//waiting model motion finish
                return Promise.resolve()
            })
            _executes.push(async () => {
                await this.delay(time * 1000)
                await this._L2dManager.display(id, {
                    x1 : values[3],
                    x2 : values[4],
                    fadeTime : fadeTime,
                })
                return Promise.resolve()
            })
        }
        else if(commandType == 12){
            // console.log(index, 'live2d漸變隱藏') 
            //未完成!!!!!!!
            // executes.push(this._L2dManager.clear(id))
            _executes.push(async () => {
                await this.delay(time * 1000)
                return Promise.resolve(this._L2dManager.hide(id))
            })
        }
        else if(commandType == 13){
            // console.log(index, 'live2d位置移動')
            for (let index = 0; index < commandParams.length; index++) {
                _executes.push(async () => {
                    await this.delay(commandParams[index].time * 1000)
                    await this._L2dManager.moving(id, {
                        newpoint : commandParams[index].values[0],
                        rate : commandParams[index].rate
                    })
                    return Promise.resolve()
                })
            }
        }
        else if(commandType == 14){
            // console.log(index, 'live2d motion動作')   
            for (let index = 0; index < commandParams.length; index++) {
                _executes.push(async() => {
                    await this.delay(commandParams[index].time * 1000)
                    await this._L2dManager.action(id, {
                        motion : commandParams[index].values[0],
                        expression : commandParams[index].values[1],
                        facing : commandParams[index].values[2],
                    })
                    await this.delay(1000)//waiting model motion finish
                    return Promise.resolve()
                })
            }
        }
        else if(commandType == 15){
            // console.log(index, '???')
            console.log('<----------------------------------')
            for (let index = 0; index < commandParams.length; index++) {
                _executes.push(async() => {
                    await this.delay(commandParams[index].time * 1000)
                    return Promise.resolve()
                })
            }
        }
        else if(commandType == 16){
            // console.log(index, 'live2d頭部角度')                
            for (let index = 0; index < commandParams.length; index++) {
                _executes.push(async()=>{
                    await this.delay(commandParams[index].time * 1000)
                    await this._L2dManager.lookAt(id, commandParams[index].values[0])
                    return Promise.resolve()
                })
            }
        }
        else if(commandType == 17){
            // console.log(index, 'live2d眼睛閉合')
            for (let index = 0; index < commandParams.length; index++) {
                _executes.push(async() => {
                    await this.delay(commandParams[index].time * 1000)
                    await this._L2dManager.closeEyes(id, commandParams[index].values[0])
                    return Promise.resolve()
                })
            }
        }
        else if(commandType == 18){
            // console.log(index, 'live2d消失')
            _executes.push(() => this._L2dManager.hideAll())
        }

        else if(commandType == 21){
            // console.log(index, '???')
        }
        else if(commandType == 22){
            // console.log(index, '背景Fx濾鏡')
            console.log(id, '<----------------------------???')
            _executes.push(() => this.delay(time * 1000))
        }
        else if(commandType == 23){
            // console.log(index, '播放音效')
            _executes.push(async() => {
                await this.delay(time * 1000)
                await this._SoundManager.play('SE', ResourcePath.getSEAudioSrc(id))
                return Promise.resolve()
            })

        }
        else if(commandType == 24){
            // console.log(index, '???')
        }
        else if(commandType == 25){
            // console.log(index, 'BGM切換')
            // let {isActive} = content
            // if(isActive == 0) {
            //     _executes.push(() => this._SoundManager.pause('BGM'))
            // }
            // if(isActive == 1) {
            //     _executes.push(() => this._SoundManager.play('BGM', `./Audio/BGM/${id.toString().padStart(3, '0')}.mp3`))
            // }
        }
        else if(commandType == 26){
            // console.log(index, '卡片圖')
            // console.log('!!!!!')
            let {isActive} = content
            if(isActive == 1) {
                _executes.push(() => this._StillManager.show(ResourcePath.getImageSrc(this._StoryId, id)))
            }
            if(isActive == 0) {
                _executes.push(() => this._StillManager.hide())
            }
        }
        else if(commandType == 27){
            // console.log(index, '對話框隱藏')
            _executes.push(() => this._MessageManager.hide())
        }
        else if(commandType == 29){
            // console.log(index, '???')
        }
        else if(commandType == 30){
            // console.log(index, '播卡片動畫')
        }
        else if(commandType == 31){
            // console.log(index, '中間出字')
            let {message} = content
            this._MiscManager.showText(message)
        }
        else if(commandType == 32){
            // console.log(index, '???')

        }

        else if(commandType == 101){
            // console.log(index, '???')
        }
        else if(commandType == 102){
            // console.log(index, '???')
        }
        else if(commandType == 103){
            // console.log(index, '???')
        }
        else if(commandType == 104){
            // console.log(index, '???')
        }
        else if(commandType == 105){
            // console.log(index, '???')
        }
        else if(commandType == 106){
            // console.log(index, '???')
        }
        else if(commandType == 107){
            // console.log(index, '???')
        }

        else if(commandType == 201){
            // console.log(index, '???')
        }
        else if(commandType == 202){
            // console.log(index, '???')
        }

        return {priority: _priority, executes : _executes, waiting : _waiting}
    }

    delay(time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }

    _checkHeroSort(){
        let list = []
        this._CommandSet.map((com) => com.subCommands.map((subcom)=>{
            if(subcom.commandType == 11){
                list.push(subcom.id)
            }
        }))

        return list
    }

    static get Managers() {
        return this.instance.Controllers
    }

    get Managers() {
        return {
            L2dManager : this._L2dManager,
            BGManager : this._BGManager,
            MessageManager : this._MessageManager,
            StillManager : this._StillManager,
            SoundManager : this._SoundManager,
            TranslateReader : this._TranslateReader
        }   
    }

    static get StoryDetail() {
        return this.instance.StoryDetail
    }

    get StoryDetail(){
        return {
            type : this._StoryType,
            id : this._StoryId,
            phase : this._StoryPhase,
            title : this._Storytitle,
            heroine : this._StoryHeroine
        }
    }
}


class ResourcePath{

    static l2dsrc = 'https://cpk0521.github.io/CUE-live2d-Viewer'
    static resource_path = 'https://raw.githubusercontent.com/Cpk0521/CueStoryResource/main/voice/'
    static image_src = 'https://raw.githubusercontent.com/Cpk0521/CUECardsViewer/master/public/Cards/'
        
    static getL2dSrc(heroineId, costumeId){
        return `./Assets/Live2d/${heroineId.toString().padStart(3, '0')}/${heroineId.toString().padStart(3, '0')}_${costumeId.toString().padStart(3, '0')}/${heroineId.toString().padStart(3, '0')}.model3.json`
    }

    static getL2dSrc2(heroineId, costumeId){
        return `${this.l2dsrc}/live2d/${heroineId.toString().padStart(3, '0')}/${heroineId.toString().padStart(3, '0')}_${costumeId.toString().padStart(3, '0')}/${heroineId.toString().padStart(3, '0')}.model3.json`
    }

    static getAudioSrc(index, storyType, storyId, storyPhase, storyheroine) {
        let src = ''

        switch (storyType) {
            case "Main":
                src = `${this.resource_path}/main_01/Main_01_${storyId.toString().padStart(2, '0')}/Main_01_${storyId.toString().padStart(2, '0')}_${storyPhase.toString().padStart(2, '0')}/main_01_${storyId.toString().padStart(2, '0')}_${storyPhase.toString().padStart(2, '0')}_${index.toString().padStart(3, '0')}.mp3`
                break;
            case "Event":
                break;
            case "Card":
                src = `${this.resource_path}/${storyType.toLowerCase()}/${storyType}_${storyheroine.toString().padStart(2, '0')}/${storyType}_${storyId}_${storyPhase}/${storyType.toLowerCase()}_${storyId}_${storyPhase}_${index.toString().padStart(3, '0')}.mp3`
                break;
            case "Link":
                break;
            case "Lesson":
                break;
        }

        return src
    }

    static getBGMAudioSrc(index) {
        return `./Audio/BGM/${index.toString().padStart(3, '0')}.mp3`
    }

    static getSEAudioSrc(index) {
        return `./Audio/SE/scenario_${index.toString().padStart(3, '0')}.mp3`
    }

    static getImageSrc(storyId, imageType) {
        return `${this.image_src}/${storyId}/Card_${storyId}_${imageType}_b.png`
    }

    static getMovieSrc(){
        return
    }

    static getScenarioSrc(storyType, storyId, storyPhase, storyheroine){
        return ''
    }
    

}