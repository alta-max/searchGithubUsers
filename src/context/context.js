import React, { useState, useEffect } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';
import { MdLocalFlorist } from 'react-icons/md';

const rootUrl = 'https://api.github.com';

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
    const [githubUser, setgithubUser] = useState(mockUser)
    const [repos, setrepos] = useState(mockRepos)
    const [followers, setfollowers] = useState(mockFollowers)
    const [request, setrequest] = useState(0);
    const [loading, setloading] = useState(false);
    const [error, seterror] = useState({ show: false, msg: "" })

    const searchGithubUser = async (user) => {
        toggleError();
        setloading(true)
        const response = await axios(`${rootUrl}/users/${user}`).catch(err => console.log(err))
        console.log(response);
        if (response) {
            setgithubUser(response.data)
            const { login, followers_url } = response.data

            await Promise.allSettled([axios(`${rootUrl}/users/${login}/repos?per_page=100`)
                , axios(`${followers_url}?per_page=100`)]).then((results) => {
                    const [repos, followers] = results;
                    const status = "fulfilled";
                    if (repos.status === status) {
                        setrepos(repos.value.data)
                    }
                    if (followers.status === status) {
                        setfollowers(followers.value.data)
                    }
                }).catch(err => console.log(err))

        } else {
            toggleError(true, "there is no user with the given username")
        }
        checkRequests();
        setloading(false)
    }

    const checkRequests = () => {
        axios(`${rootUrl}/rate_limit`)
            .then(({ data }) => {
                // console.log(data);
                let
                    { rate: { remaining },
                    } = data;
                setrequest(remaining);
                if (remaining === 0) {
                    toggleError(true, "Sry you exceeded your hourly limit!!!")
                }
            })
            .catch((err) => { console.log(err); })
    }

    const toggleError = (show = false, msg = "") => {
        seterror({ show, msg })
    }

    useEffect(() => {
        checkRequests();
        setloading(false)
    }, [])

    return <GithubContext.Provider value={{ githubUser, repos, followers, request, error, searchGithubUser, loading }}>{children}</GithubContext.Provider>
}

export { GithubProvider, GithubContext }