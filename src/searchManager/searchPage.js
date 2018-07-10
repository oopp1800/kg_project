import React, {Component} from 'react';

import SearchInput from './searchInput'
import SearchList from './searchList'

import {Row, Col} from 'antd';


import {
    Switch,
    Route,
    withRouter
} from 'react-router-dom';

class SearchPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            searchInput: '',
            searchResult: {
                lesson: [],
                knowledge: []
            },
            hasSearched:false
        }
    };

    updateSearchList = (data) => {
        if (!data.searchResult) return;

        let searchResult = {
            lesson: [],
            knowledge: []
        };
        if (data.searchResult.lesson) {
            searchResult.lesson = data.searchResult.lesson
        }
        if (data.searchResult.knowledge) {
            searchResult.knowledge = data.searchResult.knowledge
        }
        this.setState({
            searchInput: data.searchInput,
            searchResult: searchResult,
            hasSearched:true
        })
    };

    jumpToLessonPage = (e) => {
        const lessonId = e.target.parentNode.dataset.lid;
        console.log(lessonId)
    };


    render() {
        return (
            <div id="searchWrapper" className="searchWrapper" style={{position: 'relative'}}>
                <Row
                    style={{marginTop: '1rem', marginBottom: '1rem'}}
                >
                    <SearchInput
                        updateSearchList={this.updateSearchList}
                    />
                </Row>
                <Row
                    type="flex"
                    justify="center"
                >
                    <Col span={20}>
                        <h1>搜索词：{this.state.searchInput}</h1>
                        <SearchList
                            hasSearched={this.state.hasSearched}
                            searchResult={this.state.searchResult}
                        />
                    </Col>
                </Row>
                <div id="searchPreview"/>
            </div>
        );
    }
}


export default SearchPage