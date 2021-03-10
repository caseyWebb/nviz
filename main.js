// @ts-check

'use strict'

ko.components.register('parameter-indicator', {
  template: `<div class="indicator-label" data-bind="text: name"></div><div class="indicator" data-bind="css: name, style: { height: (scale * value()) + 'px' }"></div>`,
})

function incrementObs(obs, n) {
  obs(obs() + n)
}

class ViewModel {
  counter = 1
  paused = ko.observable(true)

  // ppm/time
  bioload = ko.observable(0)
  plants = ko.observable(0)
  nitrosomonas = ko.observable(0)
  nitrobacter = ko.observable(0)

  // ppm
  ammonia = ko.observable(0)
  nitrite = ko.observable(0)
  nitrate = ko.observable(0)

  waterChangeFrequency = ko.observable(0)
  waterChangePercent = ko.observable(20)

  constructor() {
    this.paused.subscribe((v) =>
      v ? clearInterval(this.interval) : this.start()
    )
  }

  start() {
    this.interval = setInterval(this.iterate.bind(this), 1000)
  }

  stop() {
    clearInterval(this.interval)
  }

  togglePlayState() {
    this.paused(!this.paused())
  }

  addAmmonia() {
    incrementObs(this.ammonia, 10)
  }

  addMedia() {
    incrementObs(this.nitrosomonas, 10)
    incrementObs(this.nitrobacter, 10)
  }

  increaseBioload(n) {
    incrementObs(this.bioload, n)
  }

  performWaterChange(pct) {
    const dilute = (obs) => obs(Math.ceil((obs() * (100 - pct)) / 100))
    dilute(this.ammonia)
    dilute(this.nitrite)
    dilute(this.nitrate)
  }

  iterate() {
    const bioload = parseInt(this.bioload(), 10)
    const plants = this.plants()
    let ammonia = this.ammonia()
    let nitrite = this.nitrite()
    let nitrate = this.nitrate()
    let nitrosomonas = this.nitrosomonas()
    let nitrobacter = this.nitrobacter()

    ammonia += bioload

    let processedAmmonia = Math.min(nitrosomonas, ammonia)
    ammonia -= processedAmmonia
    if (ammonia > 0) {
      const populationIncrease = Math.min(
        ammonia,
        nitrosomonas === 0 && ammonia > 1 ? 0.1 : nitrosomonas
      )
      nitrosomonas += populationIncrease
      ammonia -= populationIncrease
      processedAmmonia += populationIncrease
    } else if (processedAmmonia < nitrosomonas) {
      nitrosomonas -= (nitrosomonas - processedAmmonia) * 0.7
    }
    nitrite += processedAmmonia

    let processedNitrite = Math.min(nitrobacter, nitrite)
    nitrite -= processedNitrite
    if (nitrite > 0) {
      const populationIncrease = Math.min(
        nitrite,
        nitrobacter === 0 && nitrite > 1 ? 0.1 : nitrobacter
      )
      nitrobacter += populationIncrease
      nitrite -= populationIncrease
      processedNitrite += populationIncrease
    } else if (processedNitrite < nitrobacter) {
      nitrobacter -= (nitrobacter - processedNitrite) * 0.7 // dying bacteria feeds other bacteria
    }
    nitrate += processedNitrite

    const processedNitrate = Math.min(Math.floor(plants / 10), nitrate)
    nitrate -= processedNitrate

    this.ammonia(ammonia)
    this.nitrite(nitrite)
    this.nitrate(nitrate)
    this.nitrosomonas(nitrosomonas)
    this.nitrobacter(nitrobacter)

    if (
      this.waterChangeFrequency() > 0 &&
      this.counter++ % (9 - this.waterChangeFrequency()) === 0
    ) {
      this.performWaterChange(this.waterChangePercent())
    }

    console.log(
      'ammonia:',
      this.ammonia(),
      'nitrite:',
      this.nitrite(),
      'nitrate:',
      this.nitrate(),
      'nitrosomonas:',
      this.nitrosomonas(),
      'nitrobacter:',
      this.nitrobacter()
    )
  }
}

ko.applyBindings(new ViewModel(), document.body)
