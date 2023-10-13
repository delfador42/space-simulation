for branch in $(git branch --format '%(refname:short)'); do
    git checkout $branch
    cp ../readme .
    git add readme
    git commit -am "add readme"
done

git push --all origin