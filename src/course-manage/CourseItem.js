import React, {Component} from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import {
    withRouter,
    Link
} from 'react-router-dom';

const DEFAULT_IMG = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22288%22%20height%3D%22225%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20288%20225%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1632b6774d5%20text%20%7B%20fill%3A%23eceeef%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A14pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1632b6774d5%22%3E%3Crect%20width%3D%22288%22%20height%3D%22225%22%20fill%3D%22%2355595c%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22102.3359375%22%20y%3D%22118.7484375%22%3EThumbnail%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E'


const CourseItem = (props) => {
    const {thumbnailUrl, title, description, userName, publishDate, lessonId} = props;
    return (
        <div className="card mb-4 box-shadow">
            <img className="card-img-top"
                 data-src="holder.js/100px225?theme=thumb&amp;bg=55595c&amp;fg=eceeef&amp;text=Thumbnail"
                 style={{height: '20rem', width: '100%', display: 'block'}}
                 src={thumbnailUrl || DEFAULT_IMG}
                 data-holder-rendered="true"/>
            <div className="card-body main-course-body"
                 style={{height: '14rem', width: '100%'}}>
                <div className="d-flex w-100 justify-content-between main-course-title" style={{height: '2rem'}}>
                    <h5 className="mb-1">{title}</h5>
                </div>
                <p className="mb-1 main-course-description"
                   style={{height: '7rem'}}>{description}</p>
                <div className="d-flex justify-content-between align-items-center" data-lid={lessonId}>
                    <h6>教师：{userName}</h6>
                    <h6>发布时间：{publishDate}</h6>
                    <Link to={{
                        pathname:`/learning-page/courses/${lessonId}`,
                    }}>
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary">
                            进入课程
                        </button>
                    </Link>


                </div>

            </div>
        </div>
    )
};

export default withRouter(CourseItem)