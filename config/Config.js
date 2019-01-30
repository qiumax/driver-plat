var config = {
    // page
    page_size: 20,
    
    mongodb: {
        url: "mongodb://sa_driver:wending0304@localhost/driver"
    },
    
    redis: {
        host: 'localhost',
        port: 6379,
        pwd: 'wending0304',
        ttl: 86400
    },
    
    cos: {
        secret_id: "AKIDKVbUCeilRwDF2aAyteS6XnoZ4IGyDdbM",
        secret_key: "jEamjQr3zf5JI9lAKFwNdfaHkyxiEVYM",
        bucket: "driver-1257242347",
        region: "ap-chongqing",
        host: "https://driver-1257242347.cos.ap-chongqing.myqcloud.com"
    }
}

module.exports = config