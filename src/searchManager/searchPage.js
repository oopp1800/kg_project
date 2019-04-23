import React, {Component} from 'react';

import SearchInput from './searchInput'
import SearchList from './SearchList'

import {Row, Col} from 'antd';

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

        this.setState({
            searchInput: data.searchInput,
            searchResult: data.searchResult,
            hasSearched:true
        })
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


export default SearchPage;