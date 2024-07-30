import config from '../config.js'
import utils from '../utils.js'
import * as musicMeta from 'music-metadata'
import { exec } from 'child_process'
import fs from 'fs'

/// 此功能直接在音乐目录操作，直接修改源文件标签

/// 解析音乐标签，按专辑分类
const listAlbums = async (musicFiles) => {
    const albums = {};
    for (const file of musicFiles) {
        try {
            const metadata = await musicMeta.parseFile(file);
            const album = metadata.common.album;
            if (album == null) {
                console.error('❌', '未找到专辑信息', file);
                continue;
            }
            const artists = metadata.common.artists ?? [];
            const artistSet = new Set();
            for (const artist of artists) {
                var hasSeparator = false;
                for (const separator of config.artistSeparators) {
                    if (artist.includes(separator)) {
                        artist.split(separator).forEach(part => artistSet.add(part.trim()));
                        hasSeparator = true;
                        break;
                    }
                }
                if (!hasSeparator) {
                    artistSet.add(artist);
                }
            }
            const audio = {
                'file': file,
                'artists': Array.from(artistSet)
            }
            if (albums[album]) {
                albums[album].push(audio);
            } else {
                albums[album] = [audio];
            }
        } catch (error) {
            console.error('标签解析失败', error.message);
        }
    }
    return albums;
}

/// 获取专辑对应的专辑艺术家
const getAlbumArtist = (audios) => {
    const trackCount = audios.length
    const creativeCount = {}

    // 统计每个艺术家的作品数量
    for (const audio of audios) {
        // console.log('artist', audio.artists);
        for (const artist of audio.artists) {
            if (creativeCount[artist]) {
                creativeCount[artist] += 1;
            } else {
                creativeCount[artist] = 1;
            }
        }
    }

    // 只有一个艺术家时直接返回
    if (Object.keys(creativeCount).length == 1) {
        return null;
    }

    // 统计作品数量最多的艺术家列表
    const maxCreative = Math.max(...Object.values(creativeCount));
    const artists = Object.keys(creativeCount).filter(artist => creativeCount[artist] == maxCreative);
    if (maxCreative / trackCount >= 0.7) {
        if (artists.length < 3) {
            // 1 - 2 个艺术家，返回第一个
            return artists[0];
        }
    }

    // 判断是华语群星、欧美群星、日韩群星，默认返回群星
    const artistNames = Object.keys(creativeCount);
    if (artistNames.every(name => /[\u4e00-\u9fa5]/.test(name))) {
        return '华语群星';
    } else if (artistNames.every(name => /[\u3040-\u30FF]/.test(name))) {
        return '日韩群星';
    } else if (artistNames.every(name => /[a-zA-Z]/.test(name))) {
        return '欧美群星';
    } else {
        return '群星';
    }

}

/// 将专辑艺术家写入标签
const writeAlbumArtist = async (audioPath, albumArtist) => {
    return new Promise(async (resolve, reject) => {
        try {
            const outputFileName = audioPath.split('.').slice(0, -1).join('.') + '.temp.' + audioPath.split('.').pop();
            const command = `ffmpeg -i "${audioPath}" -metadata album_artist="${albumArtist}" -y "${outputFileName}"`;
            console.log('🚀', command);
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error('❌', '专辑艺术家写入失败', error);
                    reject(error);
                } else {
                    try {
                        // 删除原输出文件
                        fs.unlinkSync(audioPath);
                        // 将临时文件重命名为原输出文件路径
                        fs.renameSync(outputFileName, audioPath);
                        console.log('✅', '专辑艺术家写入成功', audioPath);
                        resolve();
                    } catch (error) {
                        console.error('⚠', '专辑艺术家写入成功但源文件删除失败', error);
                        reject(error);
                    }
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
    const musicFiles = losslessMusicFiles.concat(lossyMusicFiles);

    const albums = await listAlbums(musicFiles);
    for (const album in albums) {
        const albumArtist = getAlbumArtist(albums[album]);
        if (albumArtist) {
            console.log('💿', album);
            for (const audio of albums[album]) {
                console.log('🚀', `${albumArtist} => ${audio.file}`);
                await writeAlbumArtist(audio.file, albumArtist);
            }
        } else {
            console.log('⚠', `专辑 ${album} 无需写入专辑艺术家`);
        }
    }

    console.log('🎉', '专辑艺术家写入完成');
}

main()