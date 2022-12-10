const l2dsrc = 'https://cpk0521.github.io/CUE-live2d-Viewer'
const resource_path = 'https://raw.githubusercontent.com/Cpk0521/CueStoryResource/main/voice/'

class Live2dManager extends PIXI.utils.EventEmitter {

    constructor(){
        super()

        this._container = new PIXI.Container();
        this._L2dAudioPlayer = SoundManager.L2dAudioPlayer
        this._holderMap = new Map()

        //
        this._savingMode = false
        this._heroShowList = []
        this._MaxModleCount = 6
        this._builtModelCount = 0
    }

    async initialize(Assets, sortedlist) {
        if(!Assets) {
            return new Promise(()=>{})
        }

        for (let index = 0; index < Assets.length; index++) {
            await this._createHolder(Assets[index])
            // .then(async (holder)=>{
            //     await this._buildModel(holder)
            // })
        }

        if(Assets.length > this._MaxModleCount) {
            this._heroShowList = sortedlist
            this._savingMode = true

            await this._padModel()
        
        }else{

            for (let index = 0; index < Assets.length; index++) {
                let holder = this._getHolder(Assets[index].dataId)
                await this._buildModel(holder)
            }
        }

        return Promise.resolve()
    }

    async _createHolder(hero) {
        if(this._isExist(hero.dataId)){
            return new Promise(()=>{})
        }

        let modelsrc = `${l2dsrc}/live2d/${hero.heroineId.toString().padStart(3, '0')}/${hero.heroineId.toString().padStart(3, '0')}_${hero.costumeId.toString().padStart(3, '0')}/${hero.heroineId.toString().padStart(3, '0')}.model3.json`
        return Live2dHolder.create(modelsrc).then((holder)=>{
            this._holderMap.set(hero.dataId, holder)
            return holder
        })
    }

    async _buildModel(holder){
        return holder.build(this._L2dAudioPlayer).then((modelholder)=>{
            modelholder.setScale(.32)
            modelholder.setAnchor(.5)
            modelholder.setPosition(-740, GameApp.appSize.height * 0.895)
            modelholder.setVisible(false)
            modelholder.addTo(this._container)
        })
    }

    //==============================================

    async display(id, {x1, x2, fadeTime}, ...content){
        let holder = this._getBuiltHolder(id)
        let new_x = ( GameApp.appSize.width / 2 ) + x2
        holder.setPosition(new_x, GameApp.appSize.height * 0.895)

        if(this._savingMode) {
            this._heroShowList.shift()
        }

        return Promise.resolve(holder)
    }

    async action(id, {motion, expression, facing}, showup = false, ...content){
        let holder = this._getBuiltHolder(id)

        if(holder) {
            holder.setVisible(true)
        }

        if(expression != undefined) {
            await holder.executeExpressionByName(`F_${expression.toString().padStart(2, '0')}`)
        }

        if(motion != undefined && motion != 0) {

            let face = ''
            if(facing != undefined) {
                if(facing == 2) {
                    face = 'L'
                }

                if(facing == 3) {
                    face = 'R'
                }
            }

            let motion_name = `${face}P_${motion.toString().padStart(2, '0')}${showup && motion != 1?'_loop':''}`
            await holder.executeMotionByName(motion_name)
        }

        return Promise.resolve(holder)
    }

    async moving(id, {newpoint, rate}){
        let holder = this._getBuiltHolder(id)
        let new_x = ( GameApp.appSize.width / 2 ) + newpoint
        holder.setPosition(new_x, GameApp.appSize.height * 0.895)
        return Promise.resolve(holder)
    }

    async closeEyes(id, IsClose){
        let holder = this._getBuiltHolder(id)
        if(IsClose == 1 || IsClose == true){
            holder.setEyeAuto(false)
        }else if(IsClose == 0 || IsClose == false) {
            holder.setEyeAuto(true)
        }
        return Promise.resolve(holder)
    }

    async lookAt(id, degree) {
        let holder = this._getBuiltHolder(id)
        holder.setLookat(degree)
        return Promise.resolve(holder)
    }

    async speaking(id, content, rates, {storyType, storyId, storyPhase, heroine}){
        let holder = this._getBuiltHolder(id)

        let src = ''
        switch (storyType) {
            case "Main":
                break;
            case "Event":
                break;
            case "Card":
                src = `${resource_path}/${storyType.toLowerCase()}/${storyType}_${heroine.toString().padStart(2, '0')}/${storyType}_${storyId}_${storyPhase}/${storyType.toLowerCase()}_${storyId}_${storyPhase}_${content.toString().padStart(3, '0')}.mp3`
                break;
            case "Link":
                break;
            case "Lesson":
                break;
        }

        return holder.speak(src)
    }

    async hide(id) {
        let holder = this._getBuiltHolder(id)
        holder.setPosition(-740, GameApp.appSize.height * 0.895)
        holder.setVisible(false)

        if(this._savingMode) {
            if(!this._isExistInList(id) && this._heroShowList.length > 0){
                this._destory(holder)
                //補上下一個
                await this._padModel()
            }
        }

        return Promise.resolve(holder)
    }

    async hideAll() {
        let needpad = false

        this._holderMap.forEach(async(v, k, m) => {
            if(v.IsBuild) {
                v.setPosition(-740, GameApp.appSize.height * 0.895)
                v.setVisible(false)

                if(this._savingMode) {
                    if(!this._isExistInList(k) && this._heroShowList.length > 0){
                        this._destory(v)
                        
                        //避免多次運行
                        if(!needpad) {
                            needpad = true
                        }
                    }
                }

            }
        })

        if(needpad) {
            //補上下一個
            await this._padModel()
        }

    }

    async remove(id){
        let holder = this._getBuiltHolder(id)
        this._destory(holder)
    }
    
    async removeAll(){
        this._holderMap.forEach((v, k, m) => {
            if(v.IsBuild) {
                this._destory(v)
            }
        })
    }

    _destory(holder) {
        this._builtModelCount--
        return holder.destory()
    }

    _isExistInList(id){
        return this._heroShowList.includes(id)
    }

    async _padModel(){
        if(this._builtModelCount == this._MaxModleCount){
            return
        }

        for (let index = 0; index < this._heroShowList.length; index++) {
            if(this._builtModelCount == this._MaxModleCount) {
                break
            }

            let id = this._heroShowList[index]
            let holder = this._getHolder(id)
            if(holder.IsBuild){
                continue
            }

            await this._buildModel(holder).then(()=>{
                // console.log(id)
                this._builtModelCount ++
            })
        }

        // console.log(this._heroShowList)
    }

    _getResourcePath(storyType, storyId, storyPhase, heroine){
        let resource = 'https://raw.githubusercontent.com/Cpk0521/CueStoryResource/main/voice/'
        let src = ''

        switch (storyType) {
            case "Main":
                break;
            case "Event":
                break;
            case "Card":
                src = `${resource_path}/${storyType.toLowerCase()}/${storyType}_${heroine.toString().padStart(2, '0')}/${storyType}_${storyId}_${storyPhase}/${storyType.toLowerCase()}_${storyId}_${storyPhase}_`
                break;
            case "Link":
                break;
            case "Lesson":
                break;
        }
        
        return src
    }



    _getHolder(label) {
        let holder = this._holderMap.get(label)
        if(!holder){
            // throw new Error(`Model Holder ${label} not found.`);
            console.error(`Model Holder ${label} not found.`)
            return
        }

        return holder;
    }

    _getBuiltHolder(label) {
        let holder = this._holderMap.get(label)
        if(!holder || !holder.IsBuild) {
            // throw new Error(`Model ${label} not built.`);
            console.error(`Model Holder ${label} is not build.`)
            return
        }

        return holder
    }

    getAllBuiltHolder(){
        let result = {}
        this._holderMap.forEach((v, k, m) => {
            if(v.IsBuild) {
                result[k] = v
            }
        })

        return result
    }

    _isExist(label){
        return this._holderMap.has(label)
    }

    get container() {
        return this._container
    }

}