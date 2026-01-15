import React from 'react';
import './style.css'
import bookmark from '../../assets/image/icon_btn_mark.svg'
import like from '../../assets/image/heart.svg'
import comment from '../../assets/image/comment.svg'
import play from '../../assets/image/play.svg'

type CardInterface = {
    avatar?: string;
    thumbnail?: string;
    source?: string;
}

const Card: React.FC<CardInterface> = ({
    avatar,
    thumbnail,
    source,
}) => {
    
    return (
        <div id='card'>
            <div className="th">
                <img className="thumbnail" src={thumbnail} alt="thumbnail" />
                <div className="source-icon">
                    <img src={source} alt="source" />
                </div>
                <div className="bottom-text">
                    <img src={play} alt="play" />
                    <span>610.2만</span>
                </div>
            </div>

            <div className='con'>
                <div className='a'>
                    <img className="avatar" src={avatar} alt="avatar" />
                    <div>lish.wist</div>
                    <img src={bookmark} alt="bookmark" />
                </div>


                <div>도마꽂이로 도마만 꽂으시나요🥺 도마꽂이, 저희 동네엔 없어서 옆 동네 다이소로 사러가야해요 정말 큰일이죠</div>

                <div>
                    <div>
                        <img src={like} alt="like" />
                        <div>610.2만</div>
                    </div>
                    <div>
                        <img src={comment} alt="comment" />
                        <div>610.2만</div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Card;