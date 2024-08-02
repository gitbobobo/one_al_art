import config from '../config.js'
import utils from '../utils.js'
import * as musicMeta from 'music-metadata'
import fs from 'fs'
import path from 'path';

/// 此功能将音乐文件移动至目标文件夹，按专辑艺术家/专辑分类

/// 移动文件至专辑艺术家/专辑/文件名
const moveFile = async (audioFile) => {
    try {
        const metadata = await musicMeta.parseFile(audioFile);
        const title = metadata.common.title ?? '[Unknown Title]';
        if (title.includes('(伴奏)')) {
            console.log('❌', '跳过伴奏文件', audioFile);
            return;
        }

        var artist = metadata.common.albumartist ?? metadata.common.artist ?? '[Unknown Artist]'
        artist = artist.replace(/[\\/*<>|]/g, '&');
        // Windows 系统文件夹不能包含.和?
        artist = artist.replace(/[.?:"]/g, '_').trim();
        var album = metadata.common.album ?? '[Unknown Album]'
        album = album.replace(/[\\/*<>|]/g, '&');
        album = album.replace(/[.?:"]/g, '_').trim();
        const destinationFolder = path.join(config.outputPath, artist, album);
        const destinationPath = path.join(destinationFolder, path.basename(audioFile));
        if (audioFile !== destinationPath) {
            if (!fs.existsSync(destinationFolder)) {
                fs.mkdirSync(destinationFolder, { recursive: true });
            }
            fs.renameSync(audioFile, destinationPath);
            console.log('✅ 已移动至', destinationPath);
        }
    } catch (error) {
        console.error('标签解析失败', error.message);
    }
}

const main = async() => {
    const losslessMusicFiles = utils.listFiles(config.musicPath, config.lossless);
    const lossyMusicFiles = utils.listFiles(config.musicPath, config.lossy);
    const musicFiles = losslessMusicFiles.concat(lossyMusicFiles);

    for (const file of musicFiles) {
        await moveFile(file);
    }

    console.log('🎉', '文件整理完成');
}

main()