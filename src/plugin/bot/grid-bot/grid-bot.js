import Bot from '../bot.js'


class GridBot extends Bot {
    constructor($store) {
        super($store)
        this.setVersion('0.0.1')
        this.setName('grid-bot')

        let grids = []
        Object.assign(this, {
            getGrids() {
                return grids
            }
        })
    }
}

export default GridBot