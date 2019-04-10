import React from 'react';
import {
    Switch,
    Route,
    withRouter
} from 'react-router-dom';
import {CourseList, CourseContent, KnowledgePreviewPage } from './index';

const LearnerCourseRoute = ({ match }) => (
    <Switch>
        <Route exact path={`${match.url}`} component={CourseList}/>
        <Route exact path={`${match.url}/:courseId`} component={CourseContent} />
        <Route exact path={`${match.url}/:courseId/knowledge-points/:knowledgeId`} component={KnowledgePreviewPage} />
    </Switch>
);


export default withRouter(LearnerCourseRoute);