const { default: axios } = require("axios");
const moment = require('moment')
const { PutObjectCommand} = require("@aws-sdk/client-s3");

const getRadarImages = async (s3,radar_name) =>{
    let current_images = []
    console.log(`Iniciando processo coleta de imagens do radar ${radar_name}`);
    
    let last_images_response
    try{
        last_images_response = await getLastImages(radar_name)
    } catch(e){
        console.log('Erro ao consultar ultimas imagens já salvas do radar');
        console.log(e);
        
        return ;
    }
    
    if(last_images_response?.data?.Contents?.length > 0){
        current_images = last_images_response.data.Contents
    }
    
    let imageListResp
    try{
        imageListResp = await getImagesList()
    }catch(e){
        console.log('Erro ao consultar lista de imagens disponíveis do radar');
        return ;
    }

    // //lista de imagens
    let imageList = imageListResp.data

    if(imageList){
        for(let i = 0;i< imageList.length; i++){
            if(current_images.filter(x=>x.Key.includes(imageList[i].dateFile)).length === 0 && moment().subtract(48, 'hours') < moment(imageList[i].dateFile, 'YYYYMMDDHHmm') ){
                console.log(`Baixando imagem ${imageList[i].dateFile}`);
                let downloadImageResponse
                try{
                    downloadImageResponse = await downloadImage(imageList[i])
                }catch(e){
                    console.log('Erro ao fazer o download da imagem');
                    return ;
                }
                
                    
                let image = downloadImageResponse ? downloadImageResponse.data : null

                if(image){
                    console.log(`Upload para o servidor ${imageList[i].dateFile}`);
                    await uploadImage(image,`radar/${radar_name}/cappi_24h/${imageList[i].dateFile.substring(0,8)}/${imageList[i].dateFile}`,s3)
                }
            }
        }
    } else{
        console.log('Sem imagens para salvar');
        
    }

    console.log('Processo finalizado');
    
    
}

async function uploadImage(data,name, s3){    

    const command = new PutObjectCommand({
        Bucket: 'images', //default
        Key: name,
        Body: data,
        ContentType: 'image/png'
    });

    try {
        const result = await s3.send(command);
        console.log('✅ Upload realizado com sucesso!');
    } catch (err) {
        console.error('❌ Erro no upload:', err.message);
    }
}

async function downloadImage(item){    
    return axios({
        url: process.env.SAISP_IMAGE_ENDPOINT + item.nameList,
        responseType: 'arraybuffer'
    }).catch(e=>{
        console.log(`Erro ao baixar PNG ${item.nameList}`);
    })
}

async function getImagesList(){
    return axios({
        //pegar lista de imagens disponiveis
        url: 'https://www.saisp.br/geral/mapa/lista_imgs.jsp?fn=prod_610.json',
        auth:{
            username: process.env.SAISP_USERNAME,
            password: process.env.SAISP_PASSWORD
        }
    })
}


async function getLastImages(radar_name){
    return axios({
        //pegar lista de imagens disponiveis
        url: `https://cth.daee.sp.gov.br/sibh/api/v2/s3/radar/last_images?radar_name=${radar_name}&hours=72`
    })
}

module.exports = {
    getRadarImages
}