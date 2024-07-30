import config from '../config.js'
import utils from '../utils.js'
import fs from 'fs'
import { exec } from 'child_process'
import * as musicMeta from 'music-metadata'

/// 此功能直接在音乐目录操作，转换完成后会自动删除源文件

/// 音乐格式转换
const convertAudio = async (inputFile, outputFormat) => {
    return new Promise(async (resolve, reject) => {
        if (inputFile.endsWith(outputFormat)) {
            console.log('⚠️', '无需转换', inputFile);
            resolve(inputFile);
            return;
        }

        const metadata = await musicMeta.parseFile(inputFile);
        const tags = metadata.common;
        const artists = tags.artists.join('/');

        const output = `${inputFile.slice(0, inputFile.lastIndexOf('.'))}${outputFormat}`;
        const tempOutput = `${inputFile.slice(0, inputFile.lastIndexOf('.'))}.temp${outputFormat}`;

        const command = `ffmpeg -i "${inputFile}" -metadata title="${tags.title}" -metadata artist="${artists}" -metadata album="${tags.album}" -metadata year="${tags.year}" -metadata track="${tags.track.no}" -metadata disk="${tags.disk.no}" -y "${tempOutput}"`;
        console.log('🚀', command);
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('❌', '格式转换失败', error);
                reject(error);
            } else {
                try {
                    // 删除原文件
                    fs.unlinkSync(inputFile);
                    // 将临时文件重命名为原输出文件路径
                    fs.renameSync(tempOutput, output);
                    console.log('✅', '格式转换成功', output);
                    resolve(output);
                } catch (error) {
                    console.error('⚠', '格式转换成功但源文件删除失败', error);
                    reject(error);
                }
            }
        });
    });
}

/// 复制标签信息并删除源文件
const copyTags = async (inputFile, outputFile) => {
    return new Promise(async (resolve, reject) => {
        try {
            const metadata = await musicMeta.parseFile(inputFile);
            const tags = metadata.common;
            // 修改这里，将.temp添加到文件名中间，而不是扩展名之前
            const outputFileName = outputFile.split('.').slice(0, -1).join('.') + '.temp.' + outputFile.split('.').pop();
            const command = `ffmpeg -i "${inputFile}" -metadata title="${tags.title}" -metadata artist="${tags.artist}" -metadata album="${tags.album}" -y "${outputFileName}"`;
            console.log('🚀', command);
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error('❌', '标签复制失败', error);
                    reject(error);
                } else {
                    console.log('✅', '标签复制成功', outputFile);
                    // 删除原输出文件
                    fs.unlinkSync(inputFile);
                    // 将临时文件重命名为原输出文件路径
                    fs.renameSync(outputFileName, outputFile);
                    resolve();
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

const main = async () => {
    const losslessMusicFiles = utils.listFiles(config.musicPath, config.lossless);
    const lossyMusicFiles = utils.listFiles(config.musicPath, config.lossy);

    // 批量转换音乐
    for (const file of losslessMusicFiles) {
        await convertAudio(file, config.losslessFormat);
    }

    for (const file of lossyMusicFiles) {
        await convertAudio(file, config.lossyFormat);
    }

    console.log('🎉', '音乐格式转换完成');
}

main()