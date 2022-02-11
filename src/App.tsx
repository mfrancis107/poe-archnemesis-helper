import React from 'react';
import './App.css';
import Button from "@mui/material/Button"
import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid"
import {
    calculateReadyRecipes,
    ComputeNeeded,
    LeafNodes,
    RecipeNodes, Recipes,
    RequiredItems,
    summarizeList
} from "./archnemesis";
import {none, State, useState} from "@hookstate/core";
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import CssBaseline from "@mui/material/CssBaseline";
import Badge from "@mui/material/Badge";
import {Persistence} from '@hookstate/persistence';

const leafNodes = LeafNodes();
const recipeNodes = RecipeNodes();
const requiredItems = RequiredItems();

function App() {
    const inventory = useState<string[]>([]);
    inventory.attach(Persistence("archnemesis-inventory"))
    const summary = summarizeList(inventory.value);

    const addToInventory = (item: string) => {
        inventory[inventory.length].set(item);
    };
    const removeFromInventory = (item: string) => {
        const index = inventory.value.indexOf(item);
        console.log(index);
        if (index > -1) {
            inventory[index].set(none);
        }
    };
    const resetAll = () => {
        const result = window.confirm("Are you sure?");
        if (result) {
            inventory.set([])
        }
    };

    return (
        <>
            <CssBaseline/>
            <Box sx={{display: "flex", width: "100%"}}>
                <Stack>
                    <h5>Archnemesis Helper</h5>
                    <Grid container>
                        <Grid item xs={3}>
                            <InventorySummary inventory={inventory}/>
                        </Grid>
                        <Grid item xs={9}>
                            <Stack>
                                <h5>Add</h5>
                                <Grid spacing={3} container>
                                    {leafNodes.map(mod => (
                                        <Grid item key={mod}>
                                            <Badge color={"secondary"} badgeContent={summary[mod]}>
                                                <Button onClick={() => addToInventory(mod)} variant={"contained"}
                                                        size={"small"}>{mod}</Button>
                                            </Badge>
                                        </Grid>))}
                                </Grid>
                                <Grid spacing={3} container mt={2}>
                                    {recipeNodes.map(mod => (
                                        <Grid item key={mod}>
                                            <Badge color={"secondary"} badgeContent={summary[mod]}>
                                                <Button onClick={() => addToInventory(mod)} variant={"contained"}
                                                        size={"small"}>{mod}</Button>
                                            </Badge>
                                        </Grid>))}
                                </Grid>
                            </Stack>
                            <Stack>
                                <h5>Remove</h5>
                                <Grid spacing={3} container>
                                    {leafNodes.map(mod => (
                                        <Grid item key={mod}>
                                            <Badge color={"secondary"} badgeContent={summary[mod]}>
                                                <Button onClick={() => removeFromInventory(mod)}
                                                        variant={"contained"}
                                                        size={"small"}>{mod}</Button>
                                            </Badge>
                                        </Grid>))}

                                </Grid>
                                <Grid spacing={3} container mt={2}>
                                    {recipeNodes.map(mod => (
                                        <Grid item key={mod}>
                                            <Badge color={"secondary"} badgeContent={summary[mod]}>
                                                <Button onClick={() => removeFromInventory(mod)}
                                                        variant={"contained"}
                                                        size={"small"}>{mod}</Button>
                                            </Badge>
                                        </Grid>))}
                                </Grid>
                            </Stack>
                            <Stack>
                                <h5>Ready Recipes</h5>
                                <ReadyRecipes inventory={inventory}/>
                            </Stack>
                            <Stack sx={{mt: "250px;"}}>
                                <h5>Reset All</h5>
                                <Button variant={"contained"} onClick={resetAll}>Reset All</Button>
                            </Stack>
                        </Grid>
                    </Grid>
                </Stack>
            </Box>
        </>
    );
}

function InventorySummary(props: { inventory: State<string[]> }) {
    /// get sum of each type in inventory
    const _inventory = props.inventory.value;
    const summary = summarizeList(_inventory);
    const requiredItems = ComputeNeeded(summary);
    console.log('required', requiredItems);
    console.log('summary', summary);
    const keys = Object.keys(requiredItems);
    const tableDetails: { [mod: string]: { missing: number, stock: number, drop: boolean } } = {};
    keys.forEach(key => {
        const required = requiredItems[key];
        const have = summary[key] || 0;

        tableDetails[key] = {
            missing: required,
            stock: have,
            drop: typeof Recipes[key] === "undefined",
        }
    });

    keys.sort((a, b) => {
        const aMissing = tableDetails[a].missing;
        const bMissing = tableDetails[b].missing;
        const aDrop = tableDetails[a].drop;
        const bDrop = tableDetails[b].drop;
        if (aDrop && !bDrop) return -1;
        if (!aDrop && bDrop) return 1;
        if (aDrop && bDrop) return bMissing - aMissing;
        return bMissing - aMissing;
    });


    return (
        <>
            <TableContainer component={Paper}>
                <Table aria-label="simple table" size={"small"}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Needed</TableCell>
                            <TableCell align="right">Required</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {keys.map((key) => {
                            return <TableRow
                                key={key}
                                sx={{'&:last-child td, &:last-child th': {border: 0}}}
                            >
                                <TableCell component="th" scope="row">
                                    {tableDetails[key].drop && `! `} {key}
                                </TableCell>
                                <TableCell align="right">{tableDetails[key].missing}</TableCell>
                            </TableRow>

                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );

}

function ReadyRecipes(props: { inventory: State<string[]> }) {
    const _inventory = props.inventory.value;
    const summary = summarizeList(_inventory);
    const readyRecipes = calculateReadyRecipes(summary);
    const markDone = (mod: string) => {
        const children = Recipes[mod];
        const indexes = children.map(child => _inventory.indexOf(child));
        const merge: { [key: number]: any | string } = {};
        merge[_inventory.length] = mod
        indexes.forEach(index => {
            merge[index] = none;
        });
        props.inventory.merge(merge);

    };
    return <Grid container spacing={2}>
        {readyRecipes.map(recipe => (
            <Grid item key={recipe}><Button variant={"contained"} onClick={() => markDone(recipe)}
                                            size={"small"}>{recipe}</Button>
                {Recipes[recipe].map(child => (
                    <Box key={child}>{child}</Box>
                ))}
            </Grid>))}
    </Grid>
}

export default App;
