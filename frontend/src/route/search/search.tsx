import React, { useState, forwardRef } from 'react';
import './style.css'
import { data } from '../utils/source';
import Card from '../../component/short-card/short-card';
import Header from '../../component/header/header';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import DateIcon from '../../assets/image/datepicker.svg'
import SearchIcon from '../../assets/image/search_icon.svg'
import { ko } from 'date-fns/locale';
import Footer from '../../component/footer/footer';

const CustomInput = forwardRef(({ value, onClick }: any, ref: any) => (
    <div className="custom-date-input" onClick={onClick} ref={ref}>
        <span>{value || '날짜 선택'}</span>
        <img src={DateIcon} alt="calendar" />
    </div>
));

const Search = () => {
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    return (
        <div id='search'>
            <Header></Header>
            <div className="body">

                <div className="sw">
                    <div>
                        <div>
                            <div>카테고리</div>
                            <select>
                                <option value="all">전체</option>
                                <option value="kor">한국</option>
                                <option value="glob">해외</option>
                                <option value="ch">중국</option>
                            </select>
                            <select>
                                <option value="all">전체</option>
                                <option value="kor">한국</option>
                                <option value="glob">해외</option>
                                <option value="ch">중국</option>
                            </select>
                        </div>
                        <div>
                            <div>시작일</div>
                            <DatePicker
                                selected={startDate}
                                onChange={(date) => setStartDate(date)}
                                dateFormat="yyyy-MM-dd"
                                customInput={<CustomInput />}
                                portalId="root"
                                locale={ko}
                            />
                        </div>
                        <div>
                            <div>종료일</div>
                            <DatePicker
                                selected={endDate}
                                onChange={(date) => setEndDate(date)}
                                dateFormat="yyyy-MM-dd"
                                customInput={<CustomInput />}
                                portalId="root"
                                locale={ko}
                            />
                        </div>
                    </div>

                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="찾고 싶은 키워드를 검색해보세요"
                            className="search-input"
                        />
                        <img src={SearchIcon} alt="search" className="search-icon" />
                    </div>
                </div>



                <div className='w'>
                    {data?.map((e: any, i: any) =>
                        <Card avatar={e?.avatar} thumbnail={e?.thumbnail} source={e?.source} key={i}></Card>
                    )}
                </div>
            </div>
            <Footer></Footer>
        </div>
    );
};

export default Search;