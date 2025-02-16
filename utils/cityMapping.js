export const cityMapping = {
  臺北市: 'taipei',
  台北市: 'taipei',
  新北市: 'newTaipei',
  基隆市: 'keeLung',
  桃園市: 'taoyuan',
  新竹縣: 'hsinchuCounty',
  新竹市: 'hsinchu',
  苗栗縣: 'miaoli',
  台中市: 'taichung',
  臺中市: 'taichung',
  南投縣: 'nantou',
  彰化縣: 'changhua',
  雲林縣: 'yunlin',
  嘉義市: 'chiayi',
  嘉義縣: 'chiayiCounty',
  台南市: 'tainan',
  臺南市: 'tainan',
  高雄市: 'kaohsiung',
  屏東縣: 'pingtung',
  宜蘭縣: 'yilan',
  花蓮縣: 'hualien',
  台東縣: 'taitung',
  臺東縣: 'taitung',
  澎湖縣: 'penghu',
  金門縣: 'kinmen',
  連江縣: 'lienchiang',
}

export const getCityKey = (chineseCityName) => {
  if (cityMapping[chineseCityName]) {
    return cityMapping[chineseCityName]
  }

  const matchedCity = Object.keys(cityMapping).find(
    (city) =>
      city.includes(chineseCityName) || city.replace(/[市縣]/g, '').includes(chineseCityName),
  )

  return matchedCity ? cityMapping[matchedCity] : chineseCityName
}
