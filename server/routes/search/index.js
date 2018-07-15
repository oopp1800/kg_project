const UpdateGraph = require('../utils/updateGraph');

/**
 * 从 python 服务器返回的图数据转换为前端需要的返回数据
 * @param {Object} pyRes: {
 *      lesson: [
 *
 *      ] || undefined,
 *      knowledge: [
 *
 *      ] || undefined,
 *      mcourse: [
 *
 *      ] || undefined,
 *      acourse: [
 *
 *      ] || undefined,
 *  }
 *
 * @return {Array} [{
 *      lessonName: {String},
 *      lessonId: {ObjectId},
 *      teacherName: {Array[String]},
 *      thumbnailUrl: {String},
 *      resultsInLesson: [{
 *          type: {String},
 *          similarity: {Number} 0-1之间,
 *          id: {ObjectId},
 *          title: {String},
 *          thumbnailUrl: {String},
 *       }, ...],
 *   }, ...],
 */
const parseForReturn = pyRes => {
    const parseLesson = lesson => ({
        lessonId: lesson.id || null,
        lessonName: lesson.data.title || null,
        lessonDescription: lesson.data.description || null,
        teacherName: lesson.teacher_name || null,
        thumbnailUrl: lesson.data.thumbnailUrl || null,
        resultsInLesson: [],
    });
    const parseOther = other => ({
        type: other.type,
        similarity: other.similarity,
        id: other.id,
        title: other.data.title,
        thumbnailUrl: other.data.thumbnailUrl,
        // 还可以添加其它信息
    });

    let result = [];
    let lessonIds = [];
    if (!pyRes) return result;
    console.log(JSON.stringify(pyRes));

    // get all lesson
    for (let key in pyRes) {
        let contents = pyRes[key];

        if (key === 'lesson') {
            contents.forEach(lesson => {
                if (!lesson.lesson || !lesson.lesson.data || lessonIds.indexOf(lesson.lesson.id) !== -1) return;

                lessonIds.push(lesson.lesson.id);
                result.push(parseLesson(lesson.lesson));
            });
        }
        else {
            contents.forEach(other => {
                if (!other.lesson || !other.lesson.data || lessonIds.indexOf(other.lesson.id) !== -1) return;

                lessonIds.push(other.lesson.id);
                result.push(parseLesson(other.lesson));
            })
        }
    }

    if (result.length <= 0) return result;

    // add resultsInLesson
    // 把所有其它本体放到对应课程下
    for (let key in pyRes) {
        if (key === 'lesson') continue;

        let contents = pyRes[key];

        contents.forEach(other => {
            if (!other[key] || !other.lesson) return;

            result[lessonIds.indexOf(other.lesson.id)].resultsInLesson.push(
                parseOther({...other[key], similarity: other.similarity, type: key})
            );
        });
    }


    return result;
};

module.exports = {
    getSearchResult: function (req, res, next) {
        const searchInput = req.body.searchInput;
        const searchOptions = req.body.searchOptions;

        UpdateGraph({
            searchInput: searchInput,
            searchOptions: searchOptions
        }, 'search', searchResultFromGraph => {
            let searchResult = parseForReturn(searchResultFromGraph);

            res.json({
                status: 'success',
                data: {
                    searchResult,
                }
            })
        })

    }
};


