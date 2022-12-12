class MiscManager {

    _loader = PIXI.Assets
    constructor(){
        this._container = new PIXI.Container();
        // this._container.visible = false

        this._loader.addBundle('Misc', {
            RodinCattleya_DB : './Font/FOT_RodinCattleya_Pro_DB.otf',
            RodinCattleya_B : './Font/FOT_RodinCattleya_Pro_B.otf',
            RodinCattleya_EB : './Font/FOT_RodinCattleya_Pro_EB.otf',
            NotoSansTC_Medium : './Font/NotoSansTC_Medium.otf',
            NotoSansTC_Bold : './Font/NotoSansTC_Bold.otf',
            NotoSansTC_Black : './Font/NotoSansTC_Black.otf',
        })
    }

    async showText(text){

        await this._loader.loadBundle('Misc')
        let Text = new PIXI.Text(text, new PIXI.TextStyle({
            fontFamily: "FOT RodinCattleya Pro DB",
            fill: 0xffffff,
            fontSize: 30,
            letterSpacing: 1,
        }));
        Text.anchor.set(0.5)
        Text.position.set(GameApp.appSize.width /2 , GameApp.appSize.height /2)

        this._container.addChild(Text)
    }

    async hide(){
        this._container.visible = false
    }

    get container() {
        return this._container
    }

}